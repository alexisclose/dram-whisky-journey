import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Sparkles, TrendingUp, Users, ArrowRight } from "lucide-react";
import { IntensityRadarChart } from "@/components/IntensityRadarChart";
import { useActiveSet } from "@/context/ActiveSetContext";
import { FLAVORS } from "@/constants/tasting";

interface RevealExperienceProps {
  whisky: {
    distillery: string;
    name: string;
    image_url: string | null;
  };
  rating: number;
  selectedFlavors: string[];
  intensityRatings: Record<string, number>;
  communityFlavors: Record<string, number>;
  communityIntensity: Record<string, number>;
  ratingStats: { averageRating: number | null; totalReviews: number };
  onViewDossier: () => void;
}

export const RevealExperience = ({
  whisky,
  rating,
  selectedFlavors,
  intensityRatings,
  communityFlavors,
  communityIntensity,
  ratingStats,
  onViewDossier,
}: RevealExperienceProps) => {
  const navigate = useNavigate();
  const { activeSet } = useActiveSet();
  const [revealStep, setRevealStep] = useState(0);
  const [animatedBars, setAnimatedBars] = useState<Record<string, number>>({});

  const topCommunityFlavors = Object.entries(communityFlavors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sharedFlavors = selectedFlavors.filter((f) =>
    topCommunityFlavors.some(([key]) => key === f)
  );

  // Animate the reveal step by step
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => setRevealStep(1), 300));
    timers.push(setTimeout(() => setRevealStep(2), 1200));
    timers.push(setTimeout(() => setRevealStep(3), 2100));
    timers.push(
      setTimeout(() => {
        setRevealStep(4);
        selectedFlavors.forEach((flavor, index) => {
          setTimeout(() => {
            setAnimatedBars((prev) => ({
              ...prev,
              [flavor]: communityFlavors[flavor] || 0,
            }));
          }, index * 200);
        });
      }, 3000)
    );
    timers.push(setTimeout(() => setRevealStep(5), 4500));

    window.scrollTo({ top: 0, behavior: "instant" });

    return () => timers.forEach((t) => clearTimeout(t));
  }, [selectedFlavors, communityFlavors]);

  // Format rating display for half-stars
  const ratingDisplay = rating % 1 === 0 ? `${rating}` : rating.toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center max-w-lg">
        {/* Your Rating Reveal */}
        <div
          className={`w-full text-center mb-8 transition-all duration-700 ${
            revealStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-muted-foreground mb-2">You rated</p>
          <h2 className="text-3xl font-bold mb-2">
            {whisky.distillery} {whisky.name}
          </h2>
          <div className="flex justify-center gap-1 my-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-10 h-10 transition-all duration-300 ${
                  star <= Math.floor(rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : star - 0.5 <= rating
                    ? "text-yellow-400 fill-yellow-400/50"
                    : "text-muted"
                }`}
                style={{ transitionDelay: `${star * 100}ms` }}
              />
            ))}
          </div>
          <p className="text-4xl font-bold text-primary">{ratingDisplay} / 5</p>
        </div>

        {/* Community Rating Reveal */}
        <div
          className={`w-full bg-card rounded-2xl p-6 mb-6 transition-all duration-700 ${
            revealStep >= 2
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Community average</span>
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    ratingStats.averageRating && star <= Math.round(ratingStats.averageRating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted"
                  }`}
                />
              ))}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{ratingStats.averageRating?.toFixed(1) || "---"}</p>
              <p className="text-xs text-muted-foreground">
                {ratingStats.totalReviews} review{ratingStats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Intensity Radar Chart */}
          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Your intensity vs community
            </p>
            <IntensityRadarChart
              userRatings={intensityRatings}
              communityRatings={communityIntensity}
            />
          </div>
        </div>

        {/* Your Flavors */}
        <div
          className={`w-full bg-card rounded-2xl p-6 mb-6 transition-all duration-700 ${
            revealStep >= 3
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Your palate</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFlavors.map((key) => {
              const meta = FLAVORS.find((f) => f.key === key);
              return (
                <Badge
                  key={key}
                  className="bg-primary/20 text-primary border-primary/30 text-sm py-1 px-3"
                >
                  {meta?.label}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Community Comparison */}
        <div
          className={`w-full bg-card rounded-2xl p-6 mb-6 transition-all duration-700 ${
            revealStep >= 4
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-8 scale-95"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">How your flavors compare</span>
          </div>
          <div className="space-y-3">
            {selectedFlavors.slice(0, 5).map((key) => {
              const meta = FLAVORS.find((f) => f.key === key);
              const communityPct = animatedBars[key] || 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{meta?.label}</span>
                    <span className="text-muted-foreground">{communityPct}% agree</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${communityPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary & CTA */}
        <div
          className={`w-full text-center transition-all duration-700 ${
            revealStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {sharedFlavors.length > 0 && (
            <p className="text-muted-foreground mb-6">
              You matched{" "}
              <span className="text-primary font-semibold">{sharedFlavors.length}</span> of the
              community's top flavors!
            </p>
          )}

          <Button
            onClick={() => navigate("/my-tasting-box")}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            Back to My Tasting Box
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <Button variant="ghost" onClick={onViewDossier} className="w-full mt-3">
            View full whisky dossier
          </Button>
        </div>
      </div>
    </div>
  );
};
