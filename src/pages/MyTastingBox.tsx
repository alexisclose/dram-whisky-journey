import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, ArrowLeft } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import WhiskyMap from "@/components/Map";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { toast } from "sonner";
import { useActiveSet } from "@/context/ActiveSetContext";
import WhiskyProfileTeaser from "@/components/WhiskyProfileTeaser";

type WhiskyRow = {
  id: string;
  distillery: string;
  name: string;
  region: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  set_code?: string;
};

interface FlavorProfile {
  fruit: number;
  floral: number;
  oak: number;
  smoke: number;
  spice: number;
}

interface TastingNote {
  id: string;
  rating: number | null;
  intensity_ratings: any;
  whisky_id: string;
}

const MyTastingBox = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/my-tasting-box` : "/my-tasting-box";
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const { activeSet, allSets } = useActiveSet();
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // If no sets, redirect to MySets page
  if (allSets.length === 0) {
    return <Navigate to="/my-sets" replace />;
  }

  const { data: whiskies } = useQuery({
    queryKey: ["db-whiskies-set", activeSet],
    queryFn: async () => {
      if (!activeSet) return [];
      
      // Query whiskies for the SELECTED set only
      const { data, error } = await supabase
        .from("whisky_sets")
        .select(`
          display_order,
          set_code,
          whiskies (
            id, distillery, name, region, location, latitude, longitude
          )
        `)
        .eq("set_code", activeSet)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      
      return (data || [])
        .filter(row => row.whiskies)
        .map(row => ({ ...(row.whiskies as any), set_code: row.set_code }));
    },
    enabled: !!activeSet
  });

  const whiskyIds = useMemo(() => whiskies ? whiskies.map(w => w.id) : [], [whiskies]);

  const { data: userRatings } = useQuery({
    queryKey: ["user-ratings", user?.id, whiskyIds.join(",")],
    queryFn: async () => {
      if (!user || whiskyIds.length === 0) return {} as Record<string, number>;
      const { data, error } = await supabase
        .from("tasting_notes")
        .select("whisky_id, rating")
        .eq("user_id", user.id)
        .in("whisky_id", whiskyIds);
      if (error) throw error;
      const byId: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        if (row.rating != null) byId[row.whisky_id] = row.rating;
      });
      return byId;
    },
    enabled: !!user && whiskyIds.length > 0
  });

  // Fetch full tasting notes for flavor profile calculation
  const { data: tastingNotes } = useQuery({
    queryKey: ["user-tasting-notes-profile", user?.id],
    queryFn: async () => {
      if (!user) return [] as TastingNote[];
      const { data, error } = await supabase
        .from("tasting_notes")
        .select("id, rating, intensity_ratings, whisky_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []) as TastingNote[];
    },
    enabled: !!user
  });

  // Calculate flavor profile from tasting notes
  const flavorProfile = useMemo((): FlavorProfile | null => {
    if (!tastingNotes) return null;
    
    const validNotes = tastingNotes.filter(note => 
      note.rating !== null && 
      note.intensity_ratings && 
      typeof note.intensity_ratings === 'object'
    );

    if (validNotes.length === 0) return null;

    const convertSliderToScore = (sliderValue: number): number => {
      const mapping = [0, 2.5, 5, 7.5, 10];
      return mapping[sliderValue] || 0;
    };

    const totalWeight = validNotes.reduce((sum, note) => sum + (note.rating || 0), 0);
    if (totalWeight === 0) return null;

    const flavors = ['fruit', 'floral', 'oak', 'smoke', 'spice'] as const;
    const profile: FlavorProfile = { fruit: 0, floral: 0, oak: 0, smoke: 0, spice: 0 };

    flavors.forEach(flavor => {
      const weightedSum = validNotes.reduce((sum, note) => {
        const sliderValue = note.intensity_ratings[flavor] || 0;
        const score = convertSliderToScore(sliderValue);
        const weight = note.rating || 0;
        return sum + (score * weight);
      }, 0);
      profile[flavor] = Math.round((weightedSum / totalWeight) * 10) / 10;
    });

    return profile;
  }, [tastingNotes]);

  const tastingsCount = useMemo(() => {
    if (!tastingNotes) return 0;
    return tastingNotes.filter(n => n.rating !== null && n.intensity_ratings).length;
  }, [tastingNotes]);

  useEffect(() => {
    if (userRatings) setRatings(userRatings);
  }, [userRatings]);

  const saveRating = useMutation({
    mutationFn: async ({ whiskyId, n }: { whiskyId: string; n: number }) => {
      if (!user) throw new Error("Please log in to save ratings.");
      const { data: existing, error: selErr } = await supabase
        .from("tasting_notes")
        .select("id")
        .eq("user_id", user.id)
        .eq("whisky_id", whiskyId)
        .maybeSingle();
      if (selErr) throw selErr;
      if (existing) {
        const { error } = await supabase
          .from("tasting_notes")
          .update({ rating: n })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("tasting_notes")
          .insert({
            user_id: user.id,
            whisky_id: whiskyId,
            rating: n,
            flavors: []
          });
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      setRatings(r => ({ ...r, [variables.whiskyId]: variables.n }));
      toast.success("Rating saved");
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to save rating");
    }
  });

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Helmet>
        <title>{activeSet} Set — My Tasting Box</title>
        <meta name="description" content={`Explore whiskies from your ${activeSet} tasting set.`} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link to="/my-sets">
            <ArrowLeft className="h-4 w-4" />
            All Sets
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold capitalize">{activeSet} Set</h1>
        <Badge variant="secondary">{whiskies?.length || 0} whiskies</Badge>
      </div>
      
      <p className="text-muted-foreground mb-6 text-sm sm:text-base">
        Explore the interactive map and open dossiers.
      </p>

          <div className="mb-6 sm:mb-8 animate-fade-in">
            <WhiskyMap whiskies={whiskies || []} />
          </div>

          <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {whiskies?.map((w, index) => (
              <Fragment key={w.id}>
                <Card className="relative">
                  {ratings[w.id] && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Tasted
                    </div>
                  )}
                  <CardHeader className="pr-24">
                    <CardTitle className="flex flex-col gap-1">
                      <span>{w.distillery} — {w.name}</span>
                      <span className="text-sm font-normal text-muted-foreground">{w.region || ""}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {w.location || "Location not specified"}
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          aria-label={`Rate ${n} star`}
                          className={`p-1 rounded ${
                            ratings[w.id] && ratings[w.id] >= n ? "text-primary" : "text-muted-foreground"
                          }`}
                          onClick={() => {
                            if (!user) {
                              toast.info("Log in to save your rating");
                              return;
                            }
                            saveRating.mutate({ whiskyId: w.id, n });
                          }}
                        >
                          <Star
                            className="h-5 w-5"
                            fill={ratings[w.id] && ratings[w.id] >= n ? "currentColor" : "none"}
                          />
                        </button>
                      ))}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link
                        to={`/whisky-dossier/${w.id}`}
                        aria-label={`Open dossier for ${w.distillery} ${w.name}`}
                      >
                        Open Dossier
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Profile teaser appears after 1st whisky */}
                {index === 0 && user && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                    <WhiskyProfileTeaser 
                      flavorProfile={flavorProfile} 
                      tastingsCount={tastingsCount} 
                    />
                  </div>
                )}
              </Fragment>
            ))}
          </section>

        <aside className="mt-10 text-sm text-muted-foreground">
          {!user ? (
            <span>
              <Link to="/login" className="underline">Log in</Link> to save ratings and palate notes.
            </span>
          ) : (
            <span>Your ratings are saved to your profile.</span>
          )}
        </aside>
    </main>
  );
};

export default MyTastingBox;
