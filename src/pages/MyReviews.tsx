
import { Helmet } from "react-helmet-async";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Trash2, Star, Heart, GlassWater } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

type TastingNote = {
  id: string;
  whisky_id: string;
  rating: number | null;
  note: string | null; // correct column name
  flavors?: string[]; // array of flavor keys
  created_at: string;
  updated_at: string;
  whisky?: {
    id: string;
    distillery: string;
    name: string;
    region: string;
  };
};

const MyReviews = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/reviews` : "/reviews";
  const navigate = useNavigate();
  const { user, loading } = useAuthSession();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from("tasting_notes")
        .delete()
        .eq("id", noteId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["user-note"] });
      queryClient.invalidateQueries({ queryKey: ["community-flavors"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete review");
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-reviews", user?.id],
    queryFn: async () => {
      if (!user) return [] as TastingNote[];
      const { data: tastingNotes, error } = await supabase
        .from("tasting_notes")
        .select(`
          id,
          whisky_id,
          rating,
          note,
          flavors,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      
      // Get unique whisky IDs
      const whiskyIds = [...new Set((tastingNotes ?? []).map(tn => tn.whisky_id))];
      
      if (whiskyIds.length === 0) return [] as TastingNote[];
      
      // Fetch whisky details
      const { data: whiskies, error: whiskyError } = await supabase
        .from("whiskies")
        .select("id, distillery, name, region")
        .in("id", whiskyIds);
      
      if (whiskyError) throw whiskyError;
      
      // Create a map of whisky details
      const whiskyMap = new Map((whiskies ?? []).map(w => [w.id, w]));
      
      // Combine tasting notes with whisky details
      return (tastingNotes ?? []).map(tn => ({
        ...tn,
        whisky: whiskyMap.get(tn.whisky_id)
      })) as TastingNote[];
    },
    enabled: !!user && !loading,
    meta: {
      onError: (e: unknown) => {
        console.error("Failed to load reviews", e);
      },
    },
  });

  const { data: wishlist, isLoading: wlLoading, error: wlError } = useQuery({
    queryKey: ["my-wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [] as any[];
      const { data: rows, error } = await supabase
        .from("wishlists")
        .select("whisky_id, id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const ids = (rows ?? []).map((r: any) => r.whisky_id);
      if (ids.length === 0) return [] as any[];
      const { data: whiskies, error: werr } = await supabase
        .from("whiskies")
        .select("id, distillery, name, region")
        .in("id", ids);
      if (werr) throw werr;
      const map = new Map((whiskies ?? []).map((w: any) => [w.id, w]));
      return (rows ?? [])
        .map((r: any) => ({ id: r.id, created_at: r.created_at, whisky: map.get(r.whisky_id) }))
        .filter((x: any) => x.whisky);
    },
    enabled: !!user && !loading,
  });

  const empty = useMemo(() => (data ?? []).length === 0, [data]);

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Helmet>
        <title>My Whiskies — Dram Discoverer</title>
        <meta name="description" content="See all the tasting notes and ratings you've submitted." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">My Whiskies</h1>
        <Button variant="outline" onClick={() => navigate("/tasting")} className="w-full sm:w-auto">
          Go to Tasting
        </Button>
      </header>

      {!loading && !user && (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-0">
            <EmptyState
              icon={Star}
              title="Sign in to see your reviews"
              description="Create an account or log in to track your whisky tastings and build your flavor profile."
              action={{
                label: "Log in",
                href: "/login",
              }}
              secondaryAction={{
                label: "Sign up",
                href: "/signup",
              }}
              className="py-12"
            />
          </CardContent>
        </Card>
      )}

      {user && (
        <>
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">My Wishlist</h2>
            {wlLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
            {wlError && <p className="text-destructive">Failed to load wishlist.</p>}
            {!wlLoading && (wishlist?.length ?? 0) === 0 && (
              <Card className="max-w-md">
                <CardContent className="p-0">
                  <EmptyState
                    icon={Heart}
                    title="Your wishlist is empty"
                    description="Save whiskies you'd like to try. They'll appear here for easy access."
                    action={{
                      label: "Explore Whiskies",
                      href: "/my-tasting-box",
                    }}
                    size="sm"
                  />
                </CardContent>
              </Card>
            )}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {(wishlist ?? []).map((item: any) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {item.whisky.distillery} — {item.whisky.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
                    <span>{item.whisky.region}</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/whisky-dossier/${item.whisky.id}`}>View Dossier</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
          {error && <p className="text-destructive">Failed to load reviews.</p>}
          {!isLoading && empty && (
            <Card className="max-w-md">
              <CardContent className="p-0">
                <EmptyState
                  icon={GlassWater}
                  title="No reviews yet"
                  description="Start tasting whiskies and rating them to build your collection of tasting notes."
                  action={{
                    label: "Start Tasting",
                    href: "/my-tasting-box",
                  }}
                  size="sm"
                />
              </CardContent>
            </Card>
          )}
          <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((tn) => {
              const flavors = tn.flavors ?? [];

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
                      {tn.whisky ? (
                        <div className="text-foreground">
                          <div className="font-medium">{tn.whisky.name}</div>
                          <div className="text-sm text-muted-foreground">{tn.whisky.distillery} • {tn.whisky.region}</div>
                        </div>
                      ) : (
                        <div className="text-foreground break-all">{tn.whisky_id}</div>
                      )}
                    </div>
                    {tn.note && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">Notes</div>
                        <div className="text-foreground">{tn.note}</div>
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
                    {tn.whisky && (
                      <div className="pt-2 flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/whisky-dossier/${tn.whisky.id}`}>View Dossier</Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(tn.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {!tn.whisky && (
                      <div className="pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(tn.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
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
