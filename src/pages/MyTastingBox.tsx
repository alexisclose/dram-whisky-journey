import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import WhiskyMap from "@/components/Map";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { toast } from "sonner";
import { useActiveSet } from "@/context/ActiveSetContext";

type WhiskyRow = {
  id: string;
  distillery: string;
  name: string;
  region: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  set_code: string;
};

const MyTastingBox = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/my-tasting-box` : "/my-tasting-box";
  const { user } = useAuthSession();
  const queryClient = useQueryClient();
  const { activeSet } = useActiveSet();
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const { data: whiskies } = useQuery({
    queryKey: ["db-whiskies", activeSet],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whiskies")
        .select("id, distillery, name, region, location, latitude, longitude, set_code")
        .eq("set_code", activeSet);
      if (error) throw error;
      return (data || []) as WhiskyRow[];
    }
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
        <title>My Tasting Box — Explore 12 Drams</title>
        <meta name="description" content="Browse your curated set of 12 whiskies. Open dossiers, record your palate and add ratings as you taste." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">My Tasting Box</h1>
      <p className="text-muted-foreground mb-6 text-sm sm:text-base">Explore the interactive map of Japan and open dossiers. Add quick ratings below.</p>

      <div className="mb-6 sm:mb-8 animate-fade-in">
        <WhiskyMap whiskies={whiskies || []} />
      </div>

      <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {whiskies?.map(w => (
          <Card key={w.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{w.distillery} — {w.name}</span>
                <span className="text-sm text-muted-foreground">{w.region || ""}</span>
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
                  to={`/whisky-info/${w.id}`}
                  aria-label={`Open dossier for ${w.distillery} ${w.name}`}
                >
                  Open Dossier
                </Link>
              </Button>
            </CardFooter>
          </Card>
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