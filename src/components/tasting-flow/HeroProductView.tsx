import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft } from "lucide-react";
import { getRegionLandscape } from "@/constants/regions";

/**
 * Auto-crop transparent padding from a bottle image.
 * Returns a blob URL of the trimmed image, or null on failure.
 * Adds a small uniform padding (PAD_PCT) so the bottle doesn't touch the edges.
 */
const PAD_PCT = 0.04; // 4% padding around content

function autoCropImage(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, w, h).data;

        // Find bounding box of non-transparent pixels
        let top = h, bottom = 0, left = w, right = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (d[(y * w + x) * 4 + 3] > 10) {
              if (y < top) top = y;
              if (y > bottom) bottom = y;
              if (x < left) left = x;
              if (x > right) right = x;
            }
          }
        }

        if (bottom <= top || right <= left) {
          resolve(null);
          return;
        }

        // Add uniform padding
        const cw = right - left;
        const ch = bottom - top;
        const padX = Math.round(cw * PAD_PCT);
        const padY = Math.round(ch * PAD_PCT);
        const cropL = Math.max(0, left - padX);
        const cropT = Math.max(0, top - padY);
        const cropR = Math.min(w, right + padX);
        const cropB = Math.min(h, bottom + padY);
        const cropW = cropR - cropL;
        const cropH = cropB - cropT;

        // Create cropped canvas
        const out = document.createElement("canvas");
        out.width = cropW;
        out.height = cropH;
        out.getContext("2d")!.drawImage(
          canvas,
          cropL, cropT, cropW, cropH,
          0, 0, cropW, cropH
        );

        out.toBlob(
          (blob) => resolve(blob ? URL.createObjectURL(blob) : null),
          "image/png"
        );
      } catch {
        resolve(null); // CORS or other error
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

interface HeroProductViewProps {
  whisky: {
    id: string;
    distillery: string;
    name: string;
    region: string;
    image_url: string | null;
  };
  ratingStats: { averageRating: number | null; totalReviews: number };
  onRate: () => void;
}

export const HeroProductView = ({
  whisky,
  ratingStats,
  onRate,
}: HeroProductViewProps) => {
  const navigate = useNavigate();
  const landscape = getRegionLandscape(whisky.region);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [bottleSrc, setBottleSrc] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  // Auto-crop the bottle image on mount / when whisky changes
  useEffect(() => {
    if (!whisky.image_url) return;

    let cancelled = false;
    autoCropImage(whisky.image_url).then((croppedUrl) => {
      if (cancelled) {
        if (croppedUrl) URL.revokeObjectURL(croppedUrl);
        return;
      }
      // Clean up previous blob
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
      if (croppedUrl) {
        blobRef.current = croppedUrl;
        setBottleSrc(croppedUrl);
      } else {
        // CORS failed or image had no transparent padding — use original
        blobRef.current = null;
        setBottleSrc(whisky.image_url);
      }
    });

    return () => {
      cancelled = true;
      if (blobRef.current) {
        URL.revokeObjectURL(blobRef.current);
        blobRef.current = null;
      }
    };
  }, [whisky.image_url]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ===== LANDSCAPE SECTION ===== */}
      <div
        className="relative w-full shrink-0"
        style={{ height: "42vh", minHeight: "260px", maxHeight: "400px" }}
      >
        {/* Gradient fallback — always visible behind photo */}
        <div
          className="absolute inset-0"
          style={{ background: landscape.gradientFallback }}
        />

        {/* Landscape photo (fades in over the gradient) */}
        {landscape.imageUrl && (
          <img
            src={landscape.imageUrl}
            alt={`${whisky.region} landscape`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            loading="eager"
          />
        )}

        {/* Dark scrim at bottom for smooth transition into card */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Back button — top left */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Community rating badge — top right */}
        {ratingStats.averageRating !== null && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-background/90 backdrop-blur-sm rounded-2xl px-3 py-2 shadow-lg">
              <p className="text-2xl font-bold leading-tight">
                {ratingStats.averageRating.toFixed(1)}
              </p>
              <div className="flex gap-0.5 my-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      ratingStats.averageRating &&
                      star <= Math.round(ratingStats.averageRating)
                        ? "text-primary fill-primary"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {ratingStats.totalReviews} rating
                {ratingStats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Bottle — straddles the landscape/card edge */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[35%] z-20">
          {whisky.image_url ? (
            <img
              src={bottleSrc || whisky.image_url}
              alt={`${whisky.distillery} ${whisky.name}`}
              className={`h-[22.4rem] object-contain drop-shadow-2xl transition-opacity duration-300 ${
                bottleSrc ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : (
            <div className="h-[22.4rem] w-28 bg-muted/60 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== CARD SECTION ===== */}
      <div className="relative z-10 -mt-8 flex-1">
        <div className="bg-card rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pt-[10rem] pb-8 px-6 min-h-[50vh]">
          {/* Whisky info — centered */}
          <div className="text-center -mt-[20px]">
            <p className="text-sm text-muted-foreground tracking-wide uppercase">
              {whisky.distillery}
            </p>
            <h1 className="text-2xl font-bold font-heading mt-1">
              {whisky.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Whisky from {whisky.region}
            </p>
          </div>

          {/* CTA Button — Vivino-style pill */}
          <div className="mt-[25px] flex justify-center">
            <button
              onClick={onRate}
              className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-foreground bg-transparent hover:bg-foreground/5 transition-colors duration-200"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="rateStarGrad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFB800" />
                    <stop offset="100%" stopColor="#FF6200" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26Z"
                  fill="url(#rateStarGrad)"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-base font-bold tracking-wide text-foreground">
                Rate this dram
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
