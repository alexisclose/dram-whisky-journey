import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft } from "lucide-react";
import { getRegionLandscape } from "@/constants/regions";

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
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[45%] z-20">
          {whisky.image_url ? (
            <img
              src={whisky.image_url}
              alt={`${whisky.distillery} ${whisky.name}`}
              className="h-[28rem] object-contain drop-shadow-2xl"
            />
          ) : (
            <div className="h-[28rem] w-28 bg-muted/60 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-muted-foreground text-xs">No image</span>
            </div>
          )}
        </div>
      </div>

      {/* ===== CARD SECTION ===== */}
      <div className="relative z-10 -mt-8 flex-1">
        <div className="bg-card rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pt-56 pb-8 px-6 min-h-[50vh]">
          {/* Whisky info — centered */}
          <div className="text-center">
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
          <div className="mt-8 flex justify-center">
            <button
              onClick={onRate}
              className="group flex items-center gap-3 px-8 py-4 rounded-full border-2 border-primary bg-transparent hover:bg-primary transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <Star className="w-6 h-6 text-primary fill-primary group-hover:text-primary-foreground group-hover:fill-primary-foreground transition-colors duration-200" />
              <span className="text-base font-bold tracking-wide text-primary group-hover:text-primary-foreground transition-colors duration-200">
                Rate this dram
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
