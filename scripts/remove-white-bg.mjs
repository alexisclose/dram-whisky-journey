#!/usr/bin/env node
/**
 * Remove White Backgrounds from Whisky Bottle Images
 *
 * Downloads each whisky bottle image from Supabase storage,
 * removes white/near-white backgrounds (flood-fill from edges),
 * and re-uploads the transparent PNG.
 *
 * Usage:
 *   node scripts/remove-white-bg.mjs                      # Process all whiskies
 *   node scripts/remove-white-bg.mjs --id <whisky-uuid>   # Process a single whisky
 *   node scripts/remove-white-bg.mjs --dry-run             # Preview what would be processed
 *   node scripts/remove-white-bg.mjs --limit 5             # Process first 5 whiskies only
 *   node scripts/remove-white-bg.mjs --threshold 30        # White tolerance (default: 30)
 *
 * Requirements:
 *   Set SUPABASE_ACCESS_TOKEN env var (get from browser localStorage):
 *     export SUPABASE_ACCESS_TOKEN="eyJ..."
 */

import { PNG } from "pngjs";
import sharp from "sharp";

const SUPABASE_URL = "https://spjcjjbnfbjycsxgtbpz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamNqamJuZmJqeWNzeGd0YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODEyODEsImV4cCI6MjA3MDI1NzI4MX0.zokUi6GV6rXvqq2chrRRboYtli2O1vQvzG10Rz4f5sk";
const STORAGE_BUCKET = "whisky-images";

// ── Parse CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = { threshold: 30 };
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--id" && args[i + 1]) flags.id = args[++i];
  else if (args[i] === "--limit" && args[i + 1]) flags.limit = parseInt(args[++i], 10);
  else if (args[i] === "--threshold" && args[i + 1]) flags.threshold = parseInt(args[++i], 10);
  else if (args[i] === "--dry-run") flags.dryRun = true;
  else if (args[i] === "--verbose") flags.verbose = true;
  else if (args[i] === "--help") {
    console.log(`
Usage: node scripts/remove-white-bg.mjs [options]

Options:
  --id <uuid>       Process a single whisky by ID
  --limit <n>       Process only the first N whiskies
  --threshold <n>   White color tolerance 0-255 (default: 30)
  --dry-run         Show what would be processed without making changes
  --verbose         Show detailed progress
  --help            Show this help message
`);
    process.exit(0);
  }
}

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!ACCESS_TOKEN && !flags.dryRun) {
  console.error("Error: SUPABASE_ACCESS_TOKEN env var is required.");
  console.error(
    "Get it from the browser:\n  JSON.parse(localStorage.getItem('sb-spjcjjbnfbjycsxgtbpz-auth-token')).access_token"
  );
  process.exit(1);
}

const readHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${ACCESS_TOKEN || SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

const writeHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

function log(...args) {
  if (flags.verbose) console.log("  ", ...args);
}

// ── Supabase helpers ────────────────────────────────────────────────────────
async function fetchWhiskies() {
  let url = `${SUPABASE_URL}/rest/v1/whiskies?select=id,distillery,name,image_url&order=name`;
  if (flags.id) url += `&id=eq.${flags.id}`;
  // Only whiskies that have images (not null, not placeholder)
  url += `&image_url=not.is.null`;
  const res = await fetch(url, { headers: readHeaders });
  if (!res.ok) throw new Error(`Failed to fetch whiskies: ${res.status}`);
  return res.json();
}

async function uploadToStorage(filePath, imageBuffer) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${filePath}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: imageBuffer,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function updateWhiskyImageUrl(whiskyId, publicUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/whiskies?id=eq.${whiskyId}`, {
    method: "PATCH",
    headers: { ...writeHeaders, Prefer: "return=representation" },
    body: JSON.stringify({ image_url: publicUrl }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DB update failed (${res.status}): ${body}`);
  }
  return res.json();
}

// ── Image processing ────────────────────────────────────────────────────────

/** Download an image and decode it as raw RGBA pixel data (handles PNG, JPEG, WebP) */
async function downloadAsPixels(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  // Use sharp to convert any format to raw RGBA pixels
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Create a PNG-like object for compatibility with removeWhiteBackground
  return {
    width: info.width,
    height: info.height,
    data,
    format: metadata.format, // 'png', 'jpeg', 'webp', etc.
  };
}

/** Check if a pixel at (x,y) is "white-ish" within the given threshold */
function isWhitish(data, idx, threshold) {
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  const a = data[idx + 3];
  // Already transparent — not white
  if (a < 128) return false;
  // Check if close to white
  return r >= 255 - threshold && g >= 255 - threshold && b >= 255 - threshold;
}

/**
 * Flood-fill from edges to make white background transparent.
 * Only removes white pixels connected to the image border,
 * preserving any white areas inside the bottle (labels, text, etc.)
 */
function removeWhiteBackground(png, threshold) {
  const { width, height, data } = png;
  const visited = new Uint8Array(width * height);
  const toRemove = new Uint8Array(width * height);

  // BFS queue — start from all edge pixels that are whitish
  const queue = [];

  // Seed from all 4 edges
  for (let x = 0; x < width; x++) {
    // Top edge
    const topIdx = (0 * width + x) * 4;
    if (isWhitish(data, topIdx, threshold)) {
      queue.push(x);
      visited[x] = 1;
    }
    // Bottom edge
    const botPixel = (height - 1) * width + x;
    const botIdx = botPixel * 4;
    if (isWhitish(data, botIdx, threshold)) {
      queue.push(botPixel);
      visited[botPixel] = 1;
    }
  }
  for (let y = 0; y < height; y++) {
    // Left edge
    const leftPixel = y * width;
    const leftIdx = leftPixel * 4;
    if (isWhitish(data, leftIdx, threshold)) {
      queue.push(leftPixel);
      visited[leftPixel] = 1;
    }
    // Right edge
    const rightPixel = y * width + (width - 1);
    const rightIdx = rightPixel * 4;
    if (isWhitish(data, rightIdx, threshold)) {
      queue.push(rightPixel);
      visited[rightPixel] = 1;
    }
  }

  log(`  Flood-fill seeds: ${queue.length} edge pixels`);

  // BFS flood fill
  let head = 0;
  while (head < queue.length) {
    const pixel = queue[head++];
    toRemove[pixel] = 1;

    const x = pixel % width;
    const y = Math.floor(pixel / width);

    // Check 4 neighbors
    const neighbors = [];
    if (x > 0) neighbors.push(pixel - 1);
    if (x < width - 1) neighbors.push(pixel + 1);
    if (y > 0) neighbors.push(pixel - width);
    if (y < height - 1) neighbors.push(pixel + width);

    for (const np of neighbors) {
      if (visited[np]) continue;
      visited[np] = 1;
      const idx = np * 4;
      if (isWhitish(data, idx, threshold)) {
        queue.push(np);
      }
    }
  }

  // Count how many pixels would be removed
  let removeCount = 0;
  for (let i = 0; i < toRemove.length; i++) {
    if (toRemove[i]) removeCount++;
  }

  const totalPixels = width * height;
  const removePercent = ((removeCount / totalPixels) * 100).toFixed(1);
  log(`  Will remove ${removeCount} pixels (${removePercent}% of image)`);

  // Safety check: if we'd remove >95% of the image, the image is probably
  // entirely white or the threshold is too aggressive — skip it
  if (removeCount / totalPixels > 0.95) {
    log(`  SKIP: would remove too many pixels (${removePercent}%)`);
    return { changed: false, reason: "would remove >95% of image" };
  }

  // If less than 1% would be removed, background is probably already transparent
  if (removeCount / totalPixels < 0.01) {
    log(`  SKIP: almost no white background detected (${removePercent}%)`);
    return { changed: false, reason: "no significant white background" };
  }

  // Apply: set alpha to 0 for removed pixels, with edge feathering
  for (let i = 0; i < toRemove.length; i++) {
    if (toRemove[i]) {
      const idx = i * 4;
      data[idx + 3] = 0; // Set alpha to 0
    }
  }

  // Edge feathering: for pixels adjacent to removed ones, soften alpha
  // based on how many of their neighbors were removed
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixel = y * width + x;
      if (toRemove[pixel]) continue; // Already removed

      const idx = pixel * 4;
      if (data[idx + 3] === 0) continue; // Already transparent

      // Count how many of 8 neighbors were removed
      let removedNeighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const np = (y + dy) * width + (x + dx);
          if (toRemove[np]) removedNeighbors++;
        }
      }

      // Feather: reduce alpha proportionally to removed neighbors
      if (removedNeighbors > 0) {
        const featherFactor = 1 - (removedNeighbors / 8) * 0.5;
        data[idx + 3] = Math.round(data[idx + 3] * featherFactor);
      }
    }
  }

  return { changed: true, removedPixels: removeCount, removePercent };
}

/** Encode raw RGBA data back to a PNG Buffer */
async function encodeAsPng(imageData) {
  return sharp(imageData.data, {
    raw: {
      width: imageData.width,
      height: imageData.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching whisky list...");
  const whiskies = await fetchWhiskies();

  // Filter to only those with Supabase storage URLs (our uploaded images)
  const toProcess = whiskies.filter((w) => {
    if (!w.image_url) return false;
    return w.image_url.includes(SUPABASE_URL);
  });

  if (flags.limit) toProcess.splice(flags.limit);

  console.log(`\nFound ${whiskies.length} whiskies, ${toProcess.length} have Supabase-hosted images.\n`);

  if (toProcess.length === 0) {
    console.log("No whiskies to process.");
    return;
  }

  if (flags.dryRun) {
    console.log("DRY RUN — would process:");
    toProcess.forEach((w, i) => console.log(`  ${i + 1}. ${w.distillery} — ${w.name}`));
    return;
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const w = toProcess[i];
    const label = `${w.distillery} — ${w.name}`;
    process.stdout.write(`[${i + 1}/${toProcess.length}] ${label} ... `);

    try {
      // 1. Download and decode (handles PNG, JPEG, WebP)
      log(`\n  Downloading: ${w.image_url}`);
      const imageData = await downloadAsPixels(w.image_url);
      log(`  Image: ${imageData.width}x${imageData.height} (${imageData.format})`);

      // 2. Remove white background
      const result = removeWhiteBackground(imageData, flags.threshold);

      if (!result.changed) {
        console.log(`SKIP (${result.reason})`);
        skipped++;
        continue;
      }

      // 3. Encode back to PNG
      const outputBuffer = await encodeAsPng(imageData);
      log(`  Output size: ${(outputBuffer.length / 1024).toFixed(0)}KB`);

      // 4. Upload to storage (overwrite same path)
      // Extract the storage path from the URL
      const storagePathMatch = w.image_url.match(/\/whisky-images\/(.+)$/);
      if (!storagePathMatch) {
        console.log("SKIP (can't parse storage path)");
        skipped++;
        continue;
      }
      const storagePath = storagePathMatch[1];
      await uploadToStorage(storagePath, outputBuffer);

      console.log(
        `OK (removed ${result.removePercent}% bg, ${(outputBuffer.length / 1024).toFixed(0)}KB)`
      );
      success++;

      // Small delay between uploads
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done! ${success} processed, ${skipped} skipped, ${failed} failed`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
