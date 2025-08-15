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

  // Load whisky details from database by ID including expert scores
  const { data: dbWhisky, isLoading: whiskyLoading } = useQuery({
    queryKey: ["whisky-by-id", whiskyId],
    queryFn: async () => {
      if (!whiskyId) return null;
      const { data, error } = await supabase
        .from("whiskies")
        .select("id, distillery, name, region, location, image_url, overview, expert_score_fruit, expert_score_floral, expert_score_oak, expert_score_smoke, expert_score_spice")
        .eq("id", whiskyId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!whiskyId,
  });
  const whisky = dbWhisky;

  // Load user's tasting notes to calculate their flavor profile
  const { data: userTastingNotes } = useQuery({
    queryKey: ["user-tasting-notes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tasting_notes")
        .select("rating, intensity_ratings")
        .eq("user_id", user.id)
        .not("rating", "is", null)
        .not("intensity_ratings", "is", null);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

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

  // Load all user tasting notes for this whisky
  const { data: userReviews } = useQuery({
    queryKey: ["user-reviews", dbWhisky?.id],
    queryFn: async () => {
      if (!dbWhisky?.id) return [];
      console.log("Fetching reviews for whisky ID:", dbWhisky.id);
      
      // First get tasting notes
      const { data: tastingNotes, error: notesError } = await supabase
        .from("tasting_notes")
        .select(`
          id,
          rating,
          note,
          flavors,
          intensity_ratings,
          created_at,
          user_id
        `)
        .eq("whisky_id", dbWhisky.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (notesError) {
        console.error("Notes query error:", notesError);
        throw notesError;
      }

      if (!tastingNotes || tastingNotes.length === 0) {
        console.log("No tasting notes found");
        return [];
      }

      // Get user profiles for the notes
      const userIds = tastingNotes.map(note => note.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Profiles query error:", profilesError);
        throw profilesError;
      }

      // Combine the data
      const reviewsWithProfiles = tastingNotes.map(note => ({
        ...note,
        profiles: profiles?.find(p => p.user_id === note.user_id) || {
          display_name: "Anonymous",
          username: "anonymous"
        }
      }));

      console.log("Final reviews data:", reviewsWithProfiles);
      return reviewsWithProfiles;
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

  // Calculate match percentage using user's flavor profile and whisky expert scores
  const matchPercentage = useMemo(() => {
    if (!userTastingNotes || !whisky || userTastingNotes.length === 0) return 0;

    // Filter notes that have both rating and intensity ratings
    const validNotes = userTastingNotes.filter(note => 
      note.rating !== null && 
      note.intensity_ratings && 
      typeof note.intensity_ratings === 'object'
    );

    if (validNotes.length === 0) return 0;

    // Convert slider values (0-4) to numerical scale (0-10)
    const convertSliderToScore = (sliderValue: number): number => {
      const mapping = [0, 2.5, 5, 7.5, 10];
      return mapping[sliderValue] || 0;
    };

    // Calculate weighted averages for each flavor
    const totalWeight = validNotes.reduce((sum, note) => sum + (note.rating || 0), 0);
    
    if (totalWeight === 0) return 0;

    const flavors = ['fruit', 'floral', 'oak', 'smoke', 'spice'];
    const userVector: number[] = [];
    const whiskyVector: number[] = [];

    flavors.forEach(flavor => {
      // Calculate user's weighted average for this flavor
      const weightedSum = validNotes.reduce((sum, note) => {
        const sliderValue = note.intensity_ratings[flavor] || 0;
        const score = convertSliderToScore(sliderValue);
        const weight = note.rating || 0;
        return sum + (score * weight);
      }, 0);

      const userScore = Math.round((weightedSum / totalWeight) * 10) / 10;
      userVector.push(userScore);

      // Get whisky expert score
      const expertScoreKey = `expert_score_${flavor}` as keyof typeof whisky;
      whiskyVector.push(whisky[expertScoreKey] as number || 0);
    });

    // Calculate cosine similarity
    const dotProduct = userVector.reduce((sum, val, i) => sum + val * whiskyVector[i], 0);
    const userMagnitude = Math.sqrt(userVector.reduce((sum, val) => sum + val * val, 0));
    const whiskyMagnitude = Math.sqrt(whiskyVector.reduce((sum, val) => sum + val * val, 0));

    if (userMagnitude === 0 || whiskyMagnitude === 0) return 0;

    const similarity = dotProduct / (userMagnitude * whiskyMagnitude);
    return Math.round(similarity * 100);
  }, [userTastingNotes, whisky?.expert_score_fruit, whisky?.expert_score_floral, whisky?.expert_score_oak, whisky?.expert_score_smoke, whisky?.expert_score_spice]);

  // Calculate real rating statistics from user reviews
  const ratingStats = useMemo(() => {
    if (!userReviews || userReviews.length === 0) {
      return { averageRating: null, totalReviews: 0 };
    }

    const ratingsWithValues = userReviews.filter(review => review.rating !== null);
    if (ratingsWithValues.length === 0) {
      return { averageRating: null, totalReviews: 0 };
    }

    const totalRating = ratingsWithValues.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = Math.round((totalRating / ratingsWithValues.length) * 10) / 10;
    
    return { averageRating, totalReviews: ratingsWithValues.length };
  }, [userReviews]);

  // IMPORTANT: Handle conditional returns AFTER all hooks are called
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

      {/* Hero Section - Mobile-First Design */}
      <div className="relative min-h-screen bg-background">
        {/* Background Image with Strong Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=675&fit=crop"
            alt="Scottish landscape"
            className="w-full h-full object-cover"
          />
          {/* Stronger gradient overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        </div>

        {/* Navigation Bar */}
        <div className="relative z-20 flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" className="rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 border border-white/20" asChild>
            <Link to="/tasting" aria-label="Back to Tasting Journey">
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
          </Button>
          
          {user ? (
            <Button variant="ghost" size="icon" className="rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 border border-white/20" onClick={() => toggleWishlist.mutate()} disabled={toggleWishlist.isPending}>
              <Heart className="h-5 w-5 text-white" fill={wishlistEntry ? "currentColor" : "none"} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 border border-white/20" asChild>
              <Link to="/login">
                <Heart className="h-5 w-5 text-white" />
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile-First Content Layout */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 pt-20">
          <div className="w-full max-w-sm mx-auto">
            {/* Bottle Image - Mobile Optimized */}
            <div className="flex justify-center mb-8">
              <img
                src="/placeholder.svg"
                alt={`${whisky.distillery} ${whisky.name} bottle`}
                className="w-32 h-auto max-h-48 object-contain drop-shadow-2xl"
              />
            </div>

            {/* Whisky Title with Background */}
            <div className="text-center mb-8">
              <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">{whisky.distillery}</h1>
                <h2 className="text-lg md:text-xl text-white/90 mb-4 drop-shadow-lg">{whisky.name}</h2>
                <div className="flex items-center justify-center gap-2 text-white/80">
                  <div className="w-6 h-4 bg-green-500 rounded-sm shadow-lg"></div>
                  <span className="text-sm font-medium drop-shadow-lg">Whisky from {whisky.region}</span>
                </div>
              </div>
            </div>

            {/* Stats Cards - Mobile Stack */}
            <div className="space-y-4 mb-8">
              {/* Rating Card */}
               <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                 <div className="text-center">
                   {ratingStats.averageRating !== null ? (
                     <>
                       <div className="text-4xl font-bold text-white mb-3 drop-shadow-lg">{ratingStats.averageRating}</div>
                       <div className="flex items-center justify-center gap-1 mb-2">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <Star
                             key={star}
                             className="w-6 h-6 text-yellow-400 drop-shadow-lg"
                             fill={star <= Math.floor(ratingStats.averageRating || 0) ? "currentColor" : "none"}
                           />
                         ))}
                       </div>
                       <div className="text-white/80 font-medium drop-shadow-lg">{ratingStats.totalReviews} rating{ratingStats.totalReviews !== 1 ? 's' : ''}</div>
                     </>
                   ) : (
                     <>
                       <div className="text-2xl font-bold text-white mb-3 drop-shadow-lg">No ratings yet</div>
                       <div className="text-white/80 font-medium drop-shadow-lg">Be the first to rate this whisky</div>
                     </>
                   )}
                 </div>
               </div>

              {/* Match Card */}
              <div className="bg-black/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-4 h-4 bg-blue-400 rounded-full shadow-lg"></div>
                    <span className="text-3xl font-bold text-white drop-shadow-lg">{matchPercentage}%</span>
                  </div>
                  <div className="text-white/80 font-medium drop-shadow-lg">Match for you</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Review Button - Mobile Optimized */}
      <div className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2">
        <Button 
          size="lg" 
          className="w-full md:w-auto rounded-2xl px-6 py-4 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl border border-white/20 backdrop-blur-sm"
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

      {/* Additional Content Below - Mobile-First Layout */}
      <div className="container mx-auto px-4 py-8">
        <section className="space-y-6 lg:grid lg:gap-6 lg:grid-cols-3">
          <article className="space-y-6 lg:col-span-2">
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

            {/* Community Palate Section */}
            <Card>
              <CardHeader>
                <CardTitle>Community Palate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">Top flavors reported by the community:</div>
                <div className="space-y-4">
                  {topFlavors.map(([flavorKey, percentage]) => {
                    const flavorMeta = FLAVORS.find((f) => f.key === flavorKey);
                    return (
                      <div key={flavorKey} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{flavorMeta?.label}</span>
                          <span className="text-sm font-bold">{percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* User Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle>Community Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userReviews && userReviews.length > 0 ? (
                  userReviews.map((review: any) => (
                    <div key={review.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {review.profiles?.display_name || review.profiles?.username || 'Anonymous User'}
                          </span>
                          {review.rating && (
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className="w-4 h-4 text-yellow-400"
                                  fill={star <= review.rating ? "currentColor" : "none"}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.note ? (
                        <p className="text-sm text-muted-foreground">{review.note}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No written review</p>
                      )}
                      {review.flavors && review.flavors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {review.flavors.slice(0, 5).map((flavor: string) => {
                            const flavorMeta = FLAVORS.find((f) => f.key === flavor);
                            return (
                              <Badge key={flavor} variant="outline" className="text-xs">
                                {flavorMeta?.label || flavor}
                              </Badge>
                            );
                          })}
                          {review.flavors.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{review.flavors.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    <p className="text-sm">No reviews yet. Be the first to share your tasting notes!</p>
                  </div>
                )}
              </CardContent>
            </Card>

          <Card id="review-section" className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Your Palate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mobile-Optimized Flavor Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Select flavors you taste:</label>
                <ToggleGroup type="multiple" value={selectedFlavors} onValueChange={setSelectedFlavors} className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
                  {FLAVORS.map((f) => (
                    <ToggleGroupItem 
                      key={f.key} 
                      value={f.key} 
                      aria-label={`Toggle ${f.label}`}
                      className="h-12 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {f.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

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

              {/* Mobile-Optimized Intensity Ratings */}
              <div className="space-y-6">
                <label className="text-sm font-medium">Intensity Ratings</label>
                <div className="space-y-6">
                  {INTENSITY_AXES.map((axis) => (
                    <div key={axis.key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="capitalize font-medium text-base">{axis.label}</span>
                        <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {INTENSITY_LABELS[intensityRatings[axis.key]] || "medium"}
                        </span>
                      </div>
                      <div className="px-2">
                        <Slider
                          value={[intensityRatings[axis.key]]}
                          onValueChange={(value) => setIntensityRatings(prev => ({ ...prev, [axis.key]: value[0] }))}
                          max={4}
                          min={0}
                          step={1}
                          className="w-full touch-none"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground px-2">
                        <span>none</span>
                        <span>medium</span>
                        <span>pronounced</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile-Optimized Star Rating */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Star Rating</label>
                <div className="flex justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Button
                      key={star}
                      variant="ghost"
                      size="sm"
                      className="p-2 h-auto hover:bg-transparent touch-manipulation"
                      onClick={() => setRating(rating === star ? null : star)}
                    >
                      <Star
                        className={`w-10 h-10 ${
                          rating && star <= rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                  ))}
                </div>
                {rating && (
                  <p className="text-center text-sm text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                    You rated this {rating} star{rating !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Mobile-Optimized Save Button */}
              {user ? (
                <Button 
                  onClick={() => saveMutation.mutate()} 
                  disabled={saveMutation.isPending} 
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {saveMutation.isPending ? "Saving..." : existingNote ? "Update note" : "Save note"}
                </Button>
              ) : (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <Link to="/login" className="underline font-medium">Log in</Link> to save your tasting notes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </article>
      </section>
      </div>
    </>
  );
};

export default WhiskyDossier;
