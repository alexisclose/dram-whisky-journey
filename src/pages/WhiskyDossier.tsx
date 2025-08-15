import { Helmet } from "react-helmet-async";
import { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Star, ArrowLeft, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
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

// Simple community palate distribution used as a preview for all whiskies
const DEFAULT_COMMUNITY: Record<string, number> = {
  green_apple: 62,
  vanilla: 71,
  smoke: 54,
  peat: 49,
  honey: 58,
  spice: 52,
  citrus: 41,
  chocolate: 27,
  oak: 65,
  caramel: 46,
  dried_fruit: 39,
  floral: 22,
  nutty: 28,
  pepper: 31,
  malt: 44,
  tropical: 19,
  berries: 24,
};

const WhiskyDossier = () => {
  const { id } = useParams();
  const whiskyId = (id as string) || "";
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/tasting/${whiskyId}` : `/tasting/${whiskyId}`;
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

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

  // Load whisky details from database by ID
  const { data: dbWhisky, isLoading: whiskyLoading } = useQuery({
    queryKey: ["whisky-by-id", whiskyId],
    queryFn: async () => {
      if (!whiskyId) return null;
      const { data, error } = await supabase
        .from("whiskies")
        .select("id, distillery, name, region, location, image_url, overview")
        .eq("id", whiskyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!whiskyId,
  });
  const whisky = dbWhisky;

  // Load existing user note
  const { data: existingNote } = useQuery({
    queryKey: ["user-note", dbWhisky?.id, user?.id],
    queryFn: async () => {
      if (!dbWhisky?.id || !user) return null;
      const { data, error } = await supabase
        .from("tasting_notes")
        .select("*")
        .eq("whisky_id", dbWhisky.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!dbWhisky?.id && !!user,
  });

  // Load community flavor distribution
  const { data: communityFlavors } = useQuery({
    queryKey: ["community-flavors", dbWhisky?.id],
    queryFn: async () => {
      if (!dbWhisky?.id) return [];
      const { data, error } = await supabase.rpc("get_flavor_distribution", {
        _whisky_id: dbWhisky.id,
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!dbWhisky?.id,
  });

  // Load wishlist status
  const { data: wishlistEntry } = useQuery({
    queryKey: ["wishlist-entry", dbWhisky?.id, user?.id],
    queryFn: async () => {
      if (!dbWhisky?.id || !user) return null;
      const { data, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("whisky_id", dbWhisky.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!dbWhisky?.id && !!user,
  });

  const toggleWishlist = useMutation({
    mutationFn: async () => {
      if (!user || !dbWhisky?.id) throw new Error("Missing required data");
      if (wishlistEntry) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("id", wishlistEntry.id);
        if (error) throw error;
        return "removed" as const;
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, whisky_id: dbWhisky.id });
        if (error) throw error;
        return "added" as const;
      }
    },
    onSuccess: (action) => {
      toast.success(action === "added" ? "Added to wishlist" : "Removed from wishlist");
      queryClient.invalidateQueries({ queryKey: ["wishlist-entry"] });
      queryClient.invalidateQueries({ queryKey: ["my-wishlist"] });
    },
    onError: (error) => {
      console.error("Wishlist update error:", error);
      toast.error("Failed to update wishlist");
    },
  });

  // Set form values from existing note
  useEffect(() => {
    if (existingNote) {
      setSelectedFlavors(existingNote.flavors || []);
      setRating(existingNote.rating);
      setNotes(existingNote.note || "");
      if (existingNote.intensity_ratings) {
        setIntensityRatings(existingNote.intensity_ratings as Record<string, number>);
      }
    }
  }, [existingNote]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !dbWhisky?.id) throw new Error("Missing required data");
      
      const noteData = {
        user_id: user.id,
        whisky_id: dbWhisky.id,
        rating,
        note: notes || null,
        flavors: selectedFlavors,
        intensity_ratings: intensityRatings,
      };

      if (existingNote) {
        const { error } = await supabase
          .from("tasting_notes")
          .update(noteData)
          .eq("id", existingNote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tasting_notes")
          .insert(noteData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Tasting note saved!");
      queryClient.invalidateQueries({ queryKey: ["user-note"] });
      queryClient.invalidateQueries({ queryKey: ["community-flavors"] });
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Failed to save tasting note");
    },
  });

  const community = useMemo(() => {
    if (communityFlavors?.length) {
      const flavorMap: Record<string, number> = {};
      communityFlavors.forEach((f: any) => {
        flavorMap[f.flavor] = f.percentage;
      });
      return flavorMap;
    }
    return DEFAULT_COMMUNITY;
  }, [communityFlavors]);

  const topFlavors = useMemo(() =>
    Object.entries(community)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  [community]);

  if (!whisky) {
    return (
      <main className="container mx-auto px-6 py-10">
        <Helmet>
          <title>Whisky Dossier — Not Found</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <p className="text-muted-foreground">That whisky wasn't found. <Link className="underline" to="/tasting">Back to the Tasting Journey</Link></p>
      </main>
    );
  }

  const title = `${whisky.distillery} — ${whisky.name}`;

  // Generate mock ratings and match percentage for now
  const mockRating = 4.2;
  const mockReviews = 79;
  const mockMatch = 46;

  return (
    <>
      <Helmet>
        <title>{`Whisky Dossier — ${title}`}</title>
        <meta name="description" content={`Explore tasting dossier for ${whisky.distillery} ${whisky.name}. See stats, expert notes, select your palate, and compare with community percentages.`} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: `${whisky.distillery} ${whisky.name}`,
            brand: whisky.distillery,
            category: "Whisky",
            additionalProperty: [
              { "@type": "PropertyValue", name: "Region", value: whisky.region },
              { "@type": "PropertyValue", name: "Location", value: whisky.location },
            ],
          })}
        </script>
      </Helmet>

      {/* Hero Section with Landscape Background */}
      <div className="relative min-h-screen">
        {/* Landscape Background */}
        <div className="absolute inset-0">
          <AspectRatio ratio={16/9} className="h-full">
            <img
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=675&fit=crop"
              alt="Scottish landscape"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          </AspectRatio>
        </div>

        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20" asChild>
            <Link to="/tasting" aria-label="Back to Tasting Journey">
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
          </Button>
        </div>

        {/* Wishlist Button */}
        <div className="absolute top-4 right-4 z-10">
          {user ? (
            <Button variant="ghost" size="icon" className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20" onClick={() => toggleWishlist.mutate()} disabled={toggleWishlist.isPending}>
              <Heart className="h-5 w-5 text-white" fill={wishlistEntry ? "currentColor" : "none"} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20" asChild>
              <Link to="/login">
                <Heart className="h-5 w-5 text-white" />
              </Link>
            </Button>
          )}
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-8">
          <div className="max-w-4xl w-full">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Bottle Image */}
              <div className="flex-shrink-0">
                <img
                  src="/placeholder.svg"
                  alt={`${whisky.distillery} ${whisky.name} bottle`}
                  className="w-48 h-auto max-h-96 object-contain"
                />
              </div>

              {/* Info Panel */}
              <div className="flex-1 text-white">
                {/* Rating and Reviews */}
                <div className="space-y-2 mb-6">
                  <div className="text-4xl font-bold">{mockRating}</div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-5 h-5 text-yellow-400"
                        fill={star <= Math.floor(mockRating) ? "currentColor" : "none"}
                      />
                    ))}
                  </div>
                  <div className="text-white/80">{mockReviews} ratings</div>
                </div>

                {/* Match Percentage */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                    <span className="text-2xl font-bold">{mockMatch}%</span>
                  </div>
                  <div className="text-white/80">Match for you</div>
                </div>
              </div>
            </div>

            {/* Whisky Details */}
            <div className="text-center text-white mt-8">
              <h1 className="text-2xl font-semibold mb-2">{whisky.distillery}</h1>
              <h2 className="text-xl mb-2">{whisky.name}</h2>
              <div className="flex items-center justify-center gap-2 text-white/80">
                <div className="w-6 h-4 bg-green-600 rounded-sm"></div>
                <span>Whisky from {whisky.region}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Review Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <Button 
          size="lg" 
          className="rounded-full px-8 py-6 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg"
          disabled={!user}
          onClick={() => {
            // Scroll to review section
            const reviewSection = document.getElementById('review-section');
            if (reviewSection) {
              reviewSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          {user ? 'Leave a review' : 'Log in to review'}
        </Button>
      </div>

      {/* Additional Content Below */}
      <div className="container mx-auto px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-3">
          <article className="lg:col-span-2 grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Region: {whisky.region}</Badge>
                    {whisky.location && <Badge variant="secondary">Location: {whisky.location}</Badge>}
                  </div>
                  <p>
                    {whisky.overview || `A classic expression from ${whisky.distillery}. This placeholder narrative will be replaced with a short story about the distillery, cask program, and what to expect in the glass.`}
                  </p>
                </div>
              </CardContent>
            </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expert Tasting Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Nose</strong>: Green apple, vanilla, and honey with gentle oak.</p>
              <p><strong>Palate</strong>: Citrus and spice balanced by malt sweetness; light smoke in some batches.</p>
              <p><strong>Finish</strong>: Medium length with caramel and dried fruit lingering.</p>
            </CardContent>
          </Card>

          <Card id="review-section">
            <CardHeader>
              <CardTitle>Your Palate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleGroup type="multiple" value={selectedFlavors} onValueChange={setSelectedFlavors} className="flex flex-wrap gap-2">
                {FLAVORS.map((f) => (
                  <ToggleGroupItem key={f.key} value={f.key} aria-label={`Toggle ${f.label}`}>
                    {f.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              {selectedFlavors.length > 0 && (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Your selections and how many tasters also reported them:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFlavors.map((key) => {
                      const meta = FLAVORS.find((f) => f.key === key);
                      const pct = community[key as keyof typeof community] ?? 0;
                      return (
                        <Badge key={key} variant="outline">{meta?.label}: {pct}%</Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Optional notes</label>
                <Textarea
                  placeholder="Write what you perceive: e.g., green apple on the nose, pepper on the finish..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium">Intensity Ratings</label>
                {INTENSITY_AXES.map((axis) => (
                  <div key={axis.key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{axis.label}</span>
                      <span className="text-muted-foreground">
                        {INTENSITY_LABELS[intensityRatings[axis.key]] || INTENSITY_LABELS[intensityRatings[axis.key]]}
                      </span>
                    </div>
                    <Slider
                      value={[intensityRatings[axis.key]]}
                      onValueChange={(value) => 
                        setIntensityRatings(prev => ({ ...prev, [axis.key]: value[0] }))
                      }
                      max={4}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>none</span>
                      <span>medium</span>
                      <span>pronounced</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Quick rating:</span>
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    aria-label={`Rate ${n} star`}
                    className={`p-1 rounded ${rating && rating >= n ? "text-primary" : "text-muted-foreground"}`}
                    onClick={() => setRating(n)}
                  >
                    <Star className="h-5 w-5" fill={rating && rating >= n ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              {!user ? (
                <p className="text-sm text-muted-foreground">
                  <Link to="/login" className="underline">Log in</Link> to save your tasting notes.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {existingNote ? "Update your saved note" : "Save your first note for this whisky"}
                </p>
              )}
              <Button 
                variant="outline" 
                disabled={!user || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? "Saving..." : existingNote ? "Update" : "Save"}
              </Button>
            </CardFooter>
          </Card>
        </article>

        <aside className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Community Palate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Preview percentages based on community reports.</p>
              <div className="space-y-4">
                {topFlavors.map(([key, value]) => {
                  const meta = FLAVORS.find((f) => f.key === key);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{meta?.label}</span>
                        <span className="text-muted-foreground">{value}%</span>
                      </div>
                      <Progress value={value} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
      </div>
    </>
  );
};

export default WhiskyDossier;
