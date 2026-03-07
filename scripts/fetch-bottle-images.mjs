#!/usr/bin/env node
/**
 * Fetch Whisky Bottle Images
 *
 * Searches online for high-quality bottle images, downloads them,
 * uploads to Supabase storage, and updates the whiskies table.
 *
 * Usage:
 *   node scripts/fetch-bottle-images.mjs                      # Process all whiskies missing images
 *   node scripts/fetch-bottle-images.mjs --id <whisky-uuid>    # Process a single whisky
 *   node scripts/fetch-bottle-images.mjs --dry-run             # Preview what would be processed
 *   node scripts/fetch-bottle-images.mjs --limit 5             # Process first 5 whiskies only
 *
 * Requirements:
 *   Set SUPABASE_ACCESS_TOKEN env var (get from browser localStorage):
 *     export SUPABASE_ACCESS_TOKEN="eyJ..."
 */

const SUPABASE_URL = "https://spjcjjbnfbjycsxgtbpz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamNqamJuZmJqeWNzeGd0YnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2ODEyODEsImV4cCI6MjA3MDI1NzI4MX0.zokUi6GV6rXvqq2chrRRboYtli2O1vQvzG10Rz4f5sk";
const STORAGE_BUCKET = "whisky-images";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ── Parse CLI args ──────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--id" && args[i + 1]) flags.id = args[++i];
  else if (args[i] === "--limit" && args[i + 1]) flags.limit = parseInt(args[++i], 10);
  else if (args[i] === "--dry-run") flags.dryRun = true;
  else if (args[i] === "--force") flags.force = true;
  else if (args[i] === "--verbose") flags.verbose = true;
  else if (args[i] === "--help") {
    console.log(`
Usage: node scripts/fetch-bottle-images.mjs [options]

Options:
  --id <uuid>    Process a single whisky by ID
  --limit <n>    Process only the first N whiskies
  --dry-run      Show what would be processed without making changes
  --force        Re-fetch images even if a valid one already exists
  --verbose      Show detailed search progress
  --help         Show this help message
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

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  "Content-Type": "application/json",
};

function log(...args) {
  if (flags.verbose) console.log("  ", ...args);
}

// ── Supabase helpers ────────────────────────────────────────────────────────
async function fetchWhiskies() {
  let url = `${SUPABASE_URL}/rest/v1/whiskies?select=id,distillery,name,image_url,set_code&order=name`;
  if (flags.id) url += `&id=eq.${flags.id}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Failed to fetch whiskies: ${res.status}`);
  return res.json();
}

function needsImage(w) {
  if (flags.force) return true;
  if (!w.image_url) return true;
  if (w.image_url.includes("example.com")) return true;
  if (w.image_url.includes("placeholder")) return true;
  if (w.image_url.endsWith("/whisky-images/")) return true;
  return false;
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
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify({ image_url: publicUrl }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DB update failed (${res.status}): ${body}`);
  }
  return res.json();
}

// ── Image search strategies ─────────────────────────────────────────────────

/** Build several search query variations for a given whisky */
function buildQueries(distillery, name) {
  const fullName = `${distillery} ${name}`;
  return [
    `${fullName} bottle PNG transparent`,
    `${fullName} bottle product image`,
    `${name} whisky bottle`,
    `${fullName} whiskey bottle cutout`,
  ];
}

/**
 * Score an image URL: prefer PNGs, known-good CDNs, and larger images
 */
function scoreImageUrl(url) {
  let score = 0;
  if (url.includes(".png")) score += 3;
  if (url.includes("transparent") || url.includes("cutout")) score += 2;
  if (url.includes("liquidcommerce") || url.includes("reservebar")) score += 4;
  if (url.includes("thewhiskyexchange") || url.includes("masterofmalt")) score += 3;
  if (url.includes("totalwine") || url.includes("drizly")) score += 2;
  if (url.includes("pngitem") || url.includes("pngfind") || url.includes("cleanpng")) score += 2;
  // Penalize very generic image hosts
  if (url.includes("wikipedia") || url.includes("wikimedia")) score -= 2;
  if (url.includes("favicon") || url.includes("logo")) score -= 5;
  if (url.includes("thumbnail") || url.includes("thumb")) score -= 1;
  return score;
}

/**
 * Strategy 1: DuckDuckGo image search (most reliable for scripts)
 */
async function searchDuckDuckGo(distillery, name) {
  const queries = buildQueries(distillery, name);

  for (const rawQuery of queries) {
    const query = encodeURIComponent(rawQuery);
    try {
      log(`DDG searching: "${rawQuery}"`);
      // Get vqd token
      const tokenRes = await fetch(`https://duckduckgo.com/?q=${query}&ia=images`, {
        headers: { "User-Agent": UA },
      });
      const tokenHtml = await tokenRes.text();
      const vqdMatch = tokenHtml.match(/vqd=([^&"']+)/);
      if (!vqdMatch) {
        log("DDG: no vqd token found");
        continue;
      }

      const imgRes = await fetch(
        `https://duckduckgo.com/i.js?l=us-en&o=json&q=${query}&vqd=${vqdMatch[1]}&f=,,,,,&p=1`,
        { headers: { "User-Agent": UA } }
      );
      if (!imgRes.ok) {
        log(`DDG: image API returned ${imgRes.status}`);
        continue;
      }

      const data = await imgRes.json();
      if (!data.results?.length) {
        log("DDG: no results");
        continue;
      }

      log(`DDG: ${data.results.length} results`);

      // Score and rank results
      const scored = data.results
        .slice(0, 15)
        .filter((r) => r.image && r.width > 200 && r.height > 200)
        .map((r) => ({ url: r.image, score: scoreImageUrl(r.image), w: r.width, h: r.height }))
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        log(`DDG: best match score=${scored[0].score} ${scored[0].url.substring(0, 80)}`);
        return scored[0].url;
      }

      // Fallback: just take the largest result
      const bySize = data.results
        .filter((r) => r.image && r.width > 200)
        .sort((a, b) => b.width * b.height - a.width * a.height);

      if (bySize.length > 0) return bySize[0].image;
    } catch (err) {
      log(`DDG error: ${err.message}`);
      continue;
    }

    // Small delay between queries
    await new Promise((r) => setTimeout(r, 500));
  }
  return null;
}

/**
 * Strategy 2: Bing image search — returns multiple ranked candidates
 */
async function searchBing(distillery, name) {
  const query = encodeURIComponent(`${distillery} ${name} bottle whisky`);
  try {
    log(`Bing searching: "${distillery} ${name}"`);
    const res = await fetch(
      `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1&tsc=ImageBasicHover`,
      { headers: { "User-Agent": UA } }
    );
    if (!res.ok) return [];
    const html = await res.text();

    // Extract image URLs from Bing's murl parameter
    const matches = [...html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g)];
    if (!matches.length) {
      log("Bing: no results");
      return [];
    }

    log(`Bing: ${matches.length} results`);

    const urls = matches.map((m) => decodeURIComponent(m[1]));
    // Score, deduplicate, and rank
    const seen = new Set();
    const scored = urls
      .filter((url) => { if (seen.has(url)) return false; seen.add(url); return true; })
      .map((url) => ({ url, score: scoreImageUrl(url) }))
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) log(`Bing: best match score=${scored[0].score}`);
    return scored.map((s) => s.url);
  } catch (err) {
    log(`Bing error: ${err.message}`);
    return [];
  }
}

/**
 * Main search: returns a list of candidate URLs to try, best first
 */
async function findBottleImageCandidates(distillery, name) {
  const candidates = [];

  // Strategy 1: DuckDuckGo (try first, fast)
  const ddgUrl = await searchDuckDuckGo(distillery, name);
  if (ddgUrl) candidates.push({ url: ddgUrl, source: "duckduckgo" });

  // Strategy 2: Bing (returns multiple)
  const bingUrls = await searchBing(distillery, name);
  for (const url of bingUrls) {
    candidates.push({ url, source: "bing" });
  }

  return candidates;
}

// ── Image download ──────────────────────────────────────────────────────────
async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Download failed: ${res.status} from ${url}`);

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("image")) {
    throw new Error(`Not an image: ${contentType}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return { buffer, contentType, size: buffer.length };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Fetching whisky list...");
  const whiskies = await fetchWhiskies();
  const toProcess = whiskies.filter(needsImage);

  if (flags.limit) toProcess.splice(flags.limit);

  console.log(`\nFound ${whiskies.length} whiskies total, ${toProcess.length} need images.\n`);

  if (toProcess.length === 0) {
    console.log("All whiskies have images. Use --force to re-fetch.");
    return;
  }

  if (flags.dryRun) {
    console.log("DRY RUN — would process:");
    toProcess.forEach((w, i) => console.log(`  ${i + 1}. ${w.distillery} — ${w.name}`));
    return;
  }

  let success = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < toProcess.length; i++) {
    const w = toProcess[i];
    const label = `${w.distillery} — ${w.name}`;
    process.stdout.write(`[${i + 1}/${toProcess.length}] ${label} ... `);

    try {
      // 1. Find image candidates
      const candidates = await findBottleImageCandidates(w.distillery, w.name);
      if (candidates.length === 0) {
        console.log("SKIP (no image found)");
        failures.push({ label, reason: "No image found" });
        failed++;
        continue;
      }

      // 2. Try candidates in order until one downloads successfully
      let downloaded = null;
      let usedSource = "";
      for (const candidate of candidates.slice(0, 5)) {
        try {
          const { buffer, size } = await downloadImage(candidate.url);
          if (size < 5000) {
            log(`Skipping too-small image (${size}B): ${candidate.url.substring(0, 60)}`);
            continue;
          }
          downloaded = { buffer, size };
          usedSource = candidate.source;
          break;
        } catch (dlErr) {
          log(`Download failed for ${candidate.url.substring(0, 60)}: ${dlErr.message}`);
          continue;
        }
      }

      if (!downloaded) {
        console.log(`SKIP (all ${candidates.length} download attempts failed)`);
        failures.push({ label, reason: `${candidates.length} candidates, all failed to download` });
        failed++;
        continue;
      }

      // 3. Upload to storage
      const timestamp = Date.now();
      const rand = Math.floor(Math.random() * 10000);
      const filePath = `admin/${timestamp}_${rand}.png`;
      await uploadToStorage(filePath, downloaded.buffer);

      // 4. Update DB
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${filePath}`;
      await updateWhiskyImageUrl(w.id, publicUrl);

      console.log(`OK (${(downloaded.size / 1024).toFixed(0)}KB via ${usedSource})`);
      success++;

      // Rate limit: delay between requests to be polite
      await new Promise((r) => setTimeout(r, 2000));
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      failures.push({ label, reason: err.message });
      failed++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done! ${success} succeeded, ${failed} failed out of ${toProcess.length}`);

  if (failures.length > 0) {
    console.log(`\nFailed whiskies:`);
    failures.forEach((f) => console.log(`  - ${f.label}: ${f.reason}`));
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
