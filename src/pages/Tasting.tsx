import { Helmet } from "react-helmet-async";
import { WHISKIES } from "@/data/whiskies";
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

const Tasting = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/tasting` : "/tasting";
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  const { data: dbWhiskies } = useQuery({
    queryKey: ["db-whiskies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("whiskies").select("id, distillery, name");
      if (error) throw error;
      return (data || []) as { id: string; distillery: string; name: string }[];
    },
  });

  const idMap = useMemo(() => {
    const map = new Map<number, string>();
    if (dbWhiskies) {
      WHISKIES.forEach((w) => {
        const match = dbWhiskies.find((d) => d.distillery === w.distillery && d.name === w.name);
        if (match) map.set(w.id, match.id);
      });
    }
    return map;
  }, [dbWhiskies]);

  const { data: userRatings } = useQuery({
    queryKey: ["user-ratings", user?.id, Array.from(idMap.values()).join(",")],
    queryFn: async () => {
      if (!user || idMap.size === 0) return {} as Record<number, number>;
      const ids = Array.from(idMap.values()) as string[];
      const { data, error } = await supabase
        .from("tasting_notes")
        .select("whisky_id, rating")
        .eq("user_id", user.id)
        .in("whisky_id", ids);
      if (error) throw error;
      const byLocalId: Record<number, number> = {};
      (data || []).forEach((row: any) => {
        const entry = Array.from(idMap.entries()).find(([, uuid]) => uuid === row.whisky_id);
        if (entry && row.rating != null) byLocalId[entry[0]] = row.rating;
      });
      return byLocalId;
    },
    enabled: !!user && idMap.size > 0,
  });

  useEffect(() => {
    if (userRatings) setRatings(userRatings);
  }, [userRatings]);

  const saveRating = useMutation({
    mutationFn: async ({ localId, n }: { localId: number; n: number }) => {
      if (!user) throw new Error("Please log in to save ratings.");
      const uuid = idMap.get(localId);
      if (!uuid) throw new Error("Whisky mapping not found.");

      const { data: existing, error: selErr } = await supabase
        .from("tasting_notes")
        .select("id")
        .eq("user_id", user.id)
        .eq("whisky_id", uuid)
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
          .insert({ user_id: user.id, whisky_id: uuid, rating: n, flavors: [] });
        if (error) throw error;
      }
    },
    onSuccess: (_data, variables) => {
      setRatings((r) => ({ ...r, [variables.localId]: variables.n }));
      toast.success("Rating saved");
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
    onError: (e: any) => {
      toast.error(e.message || "Failed to save rating");
    },
  });

  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>Tasting Journey — Explore 12 Drams</title>
        <meta name="description" content="Browse your curated set of 12 whiskies. Open dossiers, record your palate and add ratings as you taste." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">The Tasting Journey</h1>
      <p className="text-muted-foreground mb-6">Explore the interactive map of Scotland and open dossiers. Add quick ratings below.</p>

      <div className="mb-8 animate-fade-in">
        <WhiskyMap />
      </div>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {WHISKIES.map((w) => (
          <Card key={w.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{w.distillery} — {w.name}</span>
                <span className="text-sm text-muted-foreground">{w.region}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              ABV {w.abv}% · Lat {w.lat.toFixed(2)} · Lng {w.lng.toFixed(2)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    aria-label={`Rate ${n} star`}
                    className={`p-1 rounded ${ratings[w.id] && ratings[w.id] >= n ? "text-primary" : "text-muted-foreground"}`}
                    onClick={() => {
                      if (!user) {
                        toast.info("Log in to save your rating");
                        return;
                      }
                      saveRating.mutate({ localId: w.id, n });
                    }}
                  >
                    <Star className="h-5 w-5" fill={ratings[w.id] && ratings[w.id] >= n ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/tasting/${w.id}`} aria-label={`Open dossier for ${w.distillery} ${w.name}`}>
                  Open Dossier
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      <aside className="mt-10 text-sm text-muted-foreground">
        {!user ? (
          <span><Link to="/login" className="underline">Log in</Link> to save ratings and palate notes.</span>
        ) : (
          <span>Your ratings are saved to your profile.</span>
        )}
      </aside>
    </main>
  );
};

export default Tasting;
