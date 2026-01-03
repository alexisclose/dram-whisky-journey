import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Star, Sparkles, TrendingUp, Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FLAVORS = [
  { key: "green_apple", label: "Green Apple" },
  { key: "vanilla", label: "Vanilla" },
  { key: "smoke", label: "Smoke" },
  { key: "peat", label: "Peat" },
  { key: "honey", label: "Honey" },
  { key: "spice", label: "Spice" },
  { key: "citrus", label: "Citrus" },
  { key: "chocolate", label: "Chocolate" },
  { key: "oak", label: "Oak" },
  { key: "caramel", label: "Caramel" },
  { key: "dried_fruit", label: "Dried Fruit" },
  { key: "floral", label: "Floral" },
  { key: "nutty", label: "Nutty" },
  { key: "pepper", label: "Pepper" },
  { key: "malt", label: "Malt" },
  { key: "tropical", label: "Tropical" },
  { key: "berries", label: "Berries" },
] as const;

const INTENSITY_AXES = [
  { key: "fruit", label: "Fruit" },
  { key: "floral", label: "Floral" },
  { key: "oak", label: "Oak" },
  { key: "smoke", label: "Smoke" },
  { key: "spice", label: "Spice" },
] as const;

const INTENSITY_LABELS = ["none", "", "medium", "", "pronounced"];

interface TastingFlowExperienceProps {
  whisky: {
    id: string;
    distillery: string;
    name: string;
    region: string;
    image_url: string | null;
  };
  userId: string;
  communityFlavors: Record<string, number>;
  ratingStats: { averageRating: number | null; totalReviews: number };
  onComplete: () => void;
}

export const TastingFlowExperience = ({
  whisky,
  userId,
  communityFlavors,
  ratingStats,
  onComplete,
}: TastingFlowExperienceProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"review" | "reveal">("review");
  
  // Form state
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [intensityRatings, setIntensityRatings] = useState<Record<string, number>>({
    fruit: 2,
    floral: 2,
    oak: 2,
    smoke: 2,
    spice: 2,
  });

  // Animation states for reveal
  const [revealStep, setRevealStep] = useState(0);
  const [animatedBars, setAnimatedBars] = useState<Record<string, number>>({});

  const saveMutation = useMutation({
    mutationFn: async () => {
      const noteData = {
        user_id: userId,
        whisky_id: whisky.id,
        rating,
        note: notes || null,
        flavors: selectedFlavors,
        intensity_ratings: intensityRatings,
      };

      const { error } = await supabase
        .from("tasting_notes")
        .insert(noteData);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tasting note saved!");
      queryClient.invalidateQueries({ queryKey: ["user-note"] });
      queryClient.invalidateQueries({ queryKey: ["community-flavors"] });
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["whisky-in-tasting-box"] });
      setStep("reveal");
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Failed to save tasting note");
    },
  });

  // Animate the reveal step by step
  useEffect(() => {
    if (step === "reveal") {
      const timers: NodeJS.Timeout[] = [];
      
      // Step 1: Your rating (immediate)
      timers.push(setTimeout(() => setRevealStep(1), 300));
      
      // Step 2: Community rating
      timers.push(setTimeout(() => setRevealStep(2), 1200));
      
      // Step 3: Your flavors
      timers.push(setTimeout(() => setRevealStep(3), 2100));
      
      // Step 4: Community comparison bars (animated)
      timers.push(setTimeout(() => {
        setRevealStep(4);
        // Animate bars one by one
        selectedFlavors.forEach((flavor, index) => {
          setTimeout(() => {
            setAnimatedBars(prev => ({
              ...prev,
              [flavor]: communityFlavors[flavor] || 0
            }));
          }, index * 200);
        });
      }, 3000));
      
      // Step 5: Final summary
      timers.push(setTimeout(() => setRevealStep(5), 4500));

      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [step, selectedFlavors, communityFlavors]);

  const topCommunityFlavors = Object.entries(communityFlavors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sharedFlavors = selectedFlavors.filter(f => 
    topCommunityFlavors.some(([key]) => key === f)
  );

  if (step === "review") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
        {/* Minimal Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              {whisky.image_url && (
                <img 
                  src={whisky.image_url} 
                  alt={whisky.name}
                  className="w-12 h-16 object-contain"
                />
              )}
              <div>
                <h1 className="font-semibold text-lg">{whisky.distillery}</h1>
                <p className="text-sm text-muted-foreground">{whisky.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="container mx-auto px-4 py-8 max-w-lg">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">What do you taste?</h2>
            <p className="text-muted-foreground">Share your impressions before seeing what others think</p>
          </div>

          <div className="space-y-8">
            {/* Flavor Selection */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Select flavors you taste:</label>
              <ToggleGroup 
                type="multiple" 
                value={selectedFlavors} 
                onValueChange={setSelectedFlavors} 
                className="grid grid-cols-3 gap-2"
              >
                {FLAVORS.map((f) => (
                  <ToggleGroupItem 
                    key={f.key} 
                    value={f.key} 
                    aria-label={`Toggle ${f.label}`}
                    className="h-11 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                  >
                    {f.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* Intensity Ratings */}
            <div className="space-y-5">
              <label className="text-sm font-medium">Intensity Ratings</label>
              {INTENSITY_AXES.map((axis) => (
                <div key={axis.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{axis.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {INTENSITY_LABELS[intensityRatings[axis.key]] || "medium"}
                    </span>
                  </div>
                  <Slider
                    value={[intensityRatings[axis.key]]}
                    onValueChange={(value) => setIntensityRatings(prev => ({ ...prev, [axis.key]: value[0] }))}
                    max={4}
                    min={0}
                    step={1}
                    className="w-full touch-none"
                  />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tasting notes (optional)</label>
              <Textarea
                placeholder="Green apple on the nose, pepper on the finish..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Star Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Your rating</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto hover:bg-transparent"
                    onClick={() => setRating(rating === star ? null : star)}
                  >
                    <Star
                      className={`w-10 h-10 transition-all ${
                        rating && star <= rating
                          ? "text-yellow-400 fill-yellow-400 scale-110"
                          : "text-muted-foreground"
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending || !rating || selectedFlavors.length === 0}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {saveMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  See how you compare
                  <Sparkles className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Reveal Step - Spotify Wrapped Style
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-primary/10 flex flex-col">
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center max-w-lg">
        
        {/* Your Rating Reveal */}
        <div className={`w-full text-center mb-8 transition-all duration-700 ${
          revealStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <p className="text-muted-foreground mb-2">You rated</p>
          <h2 className="text-3xl font-bold mb-2">{whisky.distillery} {whisky.name}</h2>
          <div className="flex justify-center gap-1 my-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-10 h-10 transition-all duration-300 ${
                  rating && star <= rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-muted"
                }`}
                style={{ transitionDelay: `${star * 100}ms` }}
              />
            ))}
          </div>
          <p className="text-4xl font-bold text-primary">{rating} / 5</p>
        </div>

        {/* Community Rating Reveal */}
        <div className={`w-full bg-card rounded-2xl p-6 mb-6 transition-all duration-700 ${
          revealStep >= 2 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Community average</span>
          </div>
          <div className="flex items-center justify-between">
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
              <p className="text-2xl font-bold">
                {ratingStats.averageRating?.toFixed(1) || "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {ratingStats.totalReviews} review{ratingStats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Your Flavors */}
        <div className={`w-full bg-card rounded-2xl p-6 mb-6 transition-all duration-700 ${
          revealStep >= 3 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
        }`}>
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
        <div className={`w-full bg-card rounded-2xl p-6 mb-6 transition-all duration-700 ${
          revealStep >= 4 ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
        }`}>
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
        <div className={`w-full text-center transition-all duration-700 ${
          revealStep >= 5 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          {sharedFlavors.length > 0 && (
            <p className="text-muted-foreground mb-6">
              You matched <span className="text-primary font-semibold">{sharedFlavors.length}</span> of the community's top flavors!
            </p>
          )}
          
          <Button 
            onClick={() => navigate("/tasting")}
            className="w-full h-14 text-lg font-semibold"
            size="lg"
          >
            Back to My Tasting Box
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost"
            onClick={onComplete}
            className="w-full mt-3"
          >
            View full whisky dossier
          </Button>
        </div>
      </div>
    </div>
  );
};
