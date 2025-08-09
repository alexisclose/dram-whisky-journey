
import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

type TastingNote = {
  id: string;
  whisky_id: string;
  rating: number | null;
  notes: string | null; // updated column name
  tasting_note_flavors?: { flavor_key: string }[]; // nested relation
  created_at: string;
  updated_at: string;
};

const MyReviews = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/reviews` : "/reviews";
  const navigate = useNavigate();
  const { user, loading } = useAuthSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => {
      if (!user) return [] as TastingNote[];
      const { data, error } = await supabase
        .from("tasting_notes")
        .select(`
          id,
          whisky_id,
          rating,
          notes,
          created_at,
          updated_at,
          tasting_note_flavors ( flavor_key )
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TastingNote[];
    },
    enabled: !!user && !loading,
    meta: {
      onError: (e: unknown) => {
        console.error("Failed to load reviews", e);
      },
    },
  });

  const empty = useMemo(() => (data ?? []).length === 0, [data]);

  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>My Reviews — Dram Discoverer</title>
        <meta name="description" content="See all the tasting notes and ratings you've submitted." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-bold">My Reviews</h1>
        <Button variant="outline" onClick={() => navigate("/tasting")}>Go to Tasting</Button>
      </header>

      {!loading && !user && (
        <div className="max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle>Please log in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>You need to be logged in to see your reviews.</p>
              <div className="flex gap-2">
                <Button asChild variant="brand" size="sm"><Link to="/login">Log in</Link></Button>
                <Button asChild variant="outline" size="sm"><Link to="/signup">Sign up</Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user && (
        <>
          {isLoading && <p className="text-muted-foreground">Loading your reviews…</p>}
          {error && <p className="text-destructive">Failed to load reviews.</p>}
          {!isLoading && empty && (
            <p className="text-muted-foreground">You haven't added any reviews yet.</p>
          )}
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((tn) => {
              const flavors = (tn.tasting_note_flavors ?? []).map((f) => f.flavor_key);

              return (
                <Card key={tn.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Review</span>
                      <span className="text-sm text-muted-foreground">
                        {tn.rating !== null ? `Rating: ${tn.rating}/5` : "No rating"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">Whisky</div>
                      <div className="text-foreground break-all">{tn.whisky_id}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Name will appear once master whiskies are synced.
                      </div>
                    </div>
                    {tn.notes && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Notes</div>
                        <div className="text-foreground">{tn.notes}</div>
                      </div>
                    )}
                    {flavors.length > 0 && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Flavors</div>
                        <div className="flex flex-wrap gap-1">
                          {flavors.map((f) => (
                            <span key={f} className="px-2 py-0.5 rounded border text-xs">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
};

export default MyReviews;
