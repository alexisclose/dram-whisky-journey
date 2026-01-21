import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, ArrowLeft } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import WhiskyMap from "@/components/Map";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getGuestClient } from "@/integrations/supabase/guestClient";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useGuestSession } from "@/hooks/useGuestSession";
import { toast } from "sonner";
import { useActiveSet } from "@/context/ActiveSetContext";
import WhiskyProfileTeaser from "@/components/WhiskyProfileTeaser";
import GuestModeBanner from "@/components/GuestModeBanner";

type WhiskyRow = {
  id: string;
  distillery: string;
  name: string;
  region: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
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
  const { guestSessionId, getOrCreateGuestSessionId } = useGuestSession(!!user);
  const queryClient = useQueryClient();
  const { activeSet, allSets } = useActiveSet();
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // Determine the identifier to use for queries
  const isAuthenticated = !!user;
  const effectiveId = isAuthenticated ? user.id : guestSessionId;
  const isGuest = !isAuthenticated;
  const noSets = allSets.length === 0;

  const { data: whiskies } = useQuery({
    queryKey: ["db-whiskies-set", activeSet],
    queryFn: async () => {
      if (!activeSet) return [];

      const { data, error } = await supabase
        .from("whisky_sets")
        .select(`
          display_order,
          set_code,
          whiskies (
            id, distillery, name, region, location, latitude, longitude, image_url
          )
        `)
        .eq("set_code", activeSet)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []).filter(row => row.whiskies).map(row => ({
        ...(row.whiskies as any),
        set_code: row.set_code
      }));
    },
    enabled: !!activeSet
  });

  const whiskyIds = useMemo(() => whiskies ? whiskies.map(w => w.id) : [], [whiskies]);

  // Fetch ratings for authenticated users
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

  // Fetch ratings for guest users (using guest client with proper header for RLS)
  const { data: guestRatings } = useQuery({
    queryKey: ["guest-ratings", guestSessionId, whiskyIds.join(",")],
    queryFn: async () => {
      if (!guestSessionId || whiskyIds.length === 0) return {} as Record<string, number>;
      
      // Use guest client with x-guest-session-id header for RLS
      const guestClient = getGuestClient(guestSessionId);
      const { data, error } = await guestClient
        .from("tasting_notes")
        .select("whisky_id, rating")
        .eq("guest_session_id", guestSessionId)
        .in("whisky_id", whiskyIds);

      if (error) throw error;
      const byId: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        if (row.rating != null) byId[row.whisky_id] = row.rating;
      });
      return byId;
    },
    enabled: !user && !!guestSessionId && whiskyIds.length > 0
  });

  // Fetch full tasting notes for flavor profile calculation (authenticated users only for now)
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

  // Fetch tasting notes for guests (using guest client with proper header)
  const { data: guestTastingNotes } = useQuery({
    queryKey: ["guest-tasting-notes-profile", guestSessionId],
    queryFn: async () => {
      if (!guestSessionId) return [] as TastingNote[];
      const guestClient = getGuestClient(guestSessionId);
      const { data, error } = await guestClient
        .from("tasting_notes")
        .select("id, rating, intensity_ratings, whisky_id")
        .eq("guest_session_id", guestSessionId);

      if (error) throw error;
      return (data || []) as TastingNote[];
    },
    enabled: !user && !!guestSessionId
  });

  // Use appropriate tasting notes based on auth state
  const activeTastingNotes = isAuthenticated ? tastingNotes : guestTastingNotes;

  // Calculate flavor profile from tasting notes
  const flavorProfile = useMemo((): FlavorProfile | null => {
    if (!activeTastingNotes) return null;
    const validNotes = activeTastingNotes.filter(
      note => note.rating !== null && note.intensity_ratings && typeof note.intensity_ratings === 'object'
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
        return sum + score * weight;
      }, 0);
      profile[flavor] = Math.round(weightedSum / totalWeight * 10) / 10;
    });

    return profile;
  }, [activeTastingNotes]);

  const tastingsCount = useMemo(() => {
    if (!activeTastingNotes) return 0;
    return activeTastingNotes.filter(n => n.rating !== null && n.intensity_ratings).length;
  }, [activeTastingNotes]);

  // Merge ratings from appropriate source
  useEffect(() => {
    const source = isAuthenticated ? userRatings : guestRatings;
    if (source) setRatings(source);
  }, [userRatings, guestRatings, isAuthenticated]);

  // Optimistic rating save with support for both users and guests
  const saveRating = useMutation({
    mutationFn: async ({ whiskyId, n }: { whiskyId: string; n: number }) => {
      if (isAuthenticated) {
        // Authenticated user flow
        const { data: existing, error: selErr } = await supabase
          .from("tasting_notes")
          .select("id")
          .eq("user_id", user!.id)
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
              user_id: user!.id,
              whisky_id: whiskyId,
              rating: n,
              flavors: []
            });
          if (error) throw error;
        }
      } else {
        // Guest user flow - create/get guest session ID and use guest client
        const sessionId = getOrCreateGuestSessionId();
        const guestClient = getGuestClient(sessionId);

        const { data: existing, error: selErr } = await guestClient
          .from("tasting_notes")
          .select("id")
          .eq("guest_session_id", sessionId)
          .eq("whisky_id", whiskyId)
          .maybeSingle();

        if (selErr) throw selErr;

        if (existing) {
          const { error } = await guestClient
            .from("tasting_notes")
            .update({ rating: n })
            .eq("id", existing.id);
          if (error) throw error;
        } else {
          const { error } = await guestClient
            .from("tasting_notes")
            .insert({
              guest_session_id: sessionId,
              whisky_id: whiskyId,
              rating: n,
              flavors: []
            });
          if (error) throw error;
        }
      }
    },
    // Optimistic update
    onMutate: async ({ whiskyId, n }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["user-ratings"] });
      await queryClient.cancelQueries({ queryKey: ["guest-ratings"] });

      // Snapshot the previous value
      const previousRatings = { ...ratings };

      // Optimistically update to the new value
      setRatings(r => ({ ...r, [whiskyId]: n }));

      return { previousRatings };
    },
    onSuccess: (_data, variables) => {
      // Silently sync - no toast needed for better UX
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      queryClient.invalidateQueries({ 
        queryKey: isAuthenticated 
          ? ["user-tasting-notes-profile", user?.id]
          : ["guest-tasting-notes-profile", guestSessionId]
      });
    },
    onError: (e: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousRatings) {
        setRatings(context.previousRatings);
      }
      toast.error(e.message || "Failed to save rating");
    }
  });

  // Count ratings for guest banner
  const guestRatingsCount = useMemo(() => {
    return Object.keys(ratings).length;
  }, [ratings]);

  // If no sets, redirect to MySets page - must be after all hooks
  if (noSets) {
    return <Navigate to="/my-sets" replace />;
  }

  return (
    <main className={`container mx-auto px-4 sm:px-6 py-8 sm:py-10 ${isGuest ? 'pb-24' : ''}`}>
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
        {isGuest && (
          <Badge variant="outline" className="text-xs">
            Guest Mode
          </Badge>
        )}
      </div>
      
      <p className="text-muted-foreground mb-6 text-sm sm:text-base">
        Explore the interactive map and open dossiers.
      </p>

      <div className="mb-6 sm:mb-8 animate-fade-in">
        <WhiskyMap whiskies={whiskies || []} />
      </div>

      <section className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {whiskies?.map((w, index) => (
          <Fragment key={w.id}>
            <Link to={`/whisky-dossier/${w.id}`} className="block">
              <Card className={`relative overflow-hidden hover:shadow-lg transition-all cursor-pointer ${ratings[w.id] ? 'ring-2 ring-primary/40' : ''}`}>
                <div className="flex">
                  {/* Square whisky image */}
                  <div className="w-40 h-40 sm:w-48 sm:h-48 flex-shrink-0 bg-muted relative">
                    {w.image_url ? (
                      <img 
                        src={w.image_url} 
                        alt={`${w.distillery} ${w.name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <span className="text-4xl">🥃</span>
                      </div>
                    )}
                    {ratings[w.id] && (
                      <div className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  
                  {/* Text and rating on the right */}
                  <div className="flex-1 p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg sm:text-xl leading-tight">{w.name}</h3>
                      <p className="text-sm text-muted-foreground mt-2">{w.region || ""}</p>
                    </div>
                    
                    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button 
                          key={n} 
                          aria-label={`Rate ${n} star`} 
                          className={`p-0.5 rounded transition-colors ${ratings[w.id] && ratings[w.id] >= n ? "text-primary" : "text-muted-foreground/50 hover:text-primary/70"}`} 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            saveRating.mutate({ whiskyId: w.id, n });
                          }}
                        >
                          <Star className="h-5 w-5" fill={ratings[w.id] && ratings[w.id] >= n ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
            
            {/* Profile teaser appears after 1st whisky */}
            {index === 0 && (isAuthenticated || guestRatingsCount > 0) && (
              <div className="col-span-1 lg:col-span-2">
                <WhiskyProfileTeaser flavorProfile={flavorProfile} tastingsCount={tastingsCount} />
              </div>
            )}
          </Fragment>
        ))}
      </section>

      {/* Footer message */}
      <aside className="mt-10 text-sm text-muted-foreground">
        {isGuest ? (
          <span>
            Your ratings are saved locally.{" "}
            <Link to="/signup" className="underline font-medium text-primary">
              Create an account
            </Link>{" "}
            to keep them forever.
          </span>
        ) : (
          <span>Your ratings are saved to your profile.</span>
        )}
      </aside>

      {/* Guest mode conversion banner */}
      {isGuest && <GuestModeBanner tastingsCount={guestRatingsCount} />}
    </main>
  );
};

export default MyTastingBox;
