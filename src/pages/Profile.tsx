import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Wine, Star, Bookmark, ChevronRight, Radar, Cloud } from "lucide-react";
import ShareProfileButton from "@/components/ShareProfileButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Radar as RechartsRadar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Wordcloud } from '@visx/wordcloud';
import { scaleLog } from '@visx/scale';
import { Text } from '@visx/text';
import WhiskyRecommendations from "@/components/WhiskyRecommendations";

interface TastingNote {
  id: string;
  rating: number | null;
  intensity_ratings: any;
  whisky_id: string;
  flavors: string[];
}

interface FlavorProfile {
  fruit: number;
  floral: number;
  oak: number;
  smoke: number;
  spice: number;
}

interface WordCloudData {
  text: string;
  value: number;
  color?: string;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuthSession();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [tastingNotes, setTastingNotes] = useState<TastingNote[]>([]);
  const [flavorProfile, setFlavorProfile] = useState<FlavorProfile | null>(null);
  const [wordCloudData, setWordCloudData] = useState<WordCloudData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState({
    whiskies: 0,
    ratings: 0,
    wishlist: 0
  });

  const canonical = typeof window !== "undefined" ? `${window.location.origin}/profile` : "/profile";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch tasting notes for profile calculation
      const { data: tastingData, error: tastingError } = await supabase
        .from('tasting_notes')
        .select('id, rating, intensity_ratings, whisky_id, flavors')
        .eq('user_id', user?.id);

      if (tastingError) throw tastingError;

      setTastingNotes(tastingData || []);
      calculateFlavorProfile(tastingData || []);
      calculateWordCloudData(tastingData || []);

      // Fetch counts for stats
      const [userWhiskiesResult, ratingsResult, wishlistResult] = await Promise.all([
        supabase.from('user_whiskies').select('id', { count: 'exact', head: true }).eq('user_id', user?.id),
        supabase.from('tasting_notes').select('id', { count: 'exact', head: true }).eq('user_id', user?.id).not('rating', 'is', null),
        supabase.from('wishlists').select('id', { count: 'exact', head: true }).eq('user_id', user?.id)
      ]);

      setCounts({
        whiskies: userWhiskiesResult.count || 0,
        ratings: ratingsResult.count || 0,
        wishlist: wishlistResult.count || 0
      });

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load profile data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFlavorProfile = (notes: TastingNote[]) => {
    const validNotes = notes.filter(note => 
      note.rating !== null && 
      note.intensity_ratings && 
      typeof note.intensity_ratings === 'object'
    );

    if (validNotes.length === 0) {
      setFlavorProfile(null);
      return;
    }

    const convertSliderToScore = (sliderValue: number): number => {
      const mapping = [0, 2.5, 5, 7.5, 10];
      return mapping[sliderValue] || 0;
    };

    const totalWeight = validNotes.reduce((sum, note) => sum + (note.rating || 0), 0);
    
    if (totalWeight === 0) {
      setFlavorProfile(null);
      return;
    }

    const flavors = ['fruit', 'floral', 'oak', 'smoke', 'spice'];
    const profile: FlavorProfile = {} as FlavorProfile;

    flavors.forEach(flavor => {
      const weightedSum = validNotes.reduce((sum, note) => {
        const sliderValue = note.intensity_ratings[flavor] || 0;
        const score = convertSliderToScore(sliderValue);
        const weight = note.rating || 0;
        return sum + (score * weight);
      }, 0);

      profile[flavor as keyof FlavorProfile] = Math.round((weightedSum / totalWeight) * 10) / 10;
    });

    setFlavorProfile(profile);
  };

  const calculateWordCloudData = (notes: TastingNote[]) => {
    const validNotes = notes.filter(note => 
      note.rating !== null && 
      note.flavors && 
      Array.isArray(note.flavors) && 
      note.flavors.length > 0
    );

    if (validNotes.length === 0) {
      setWordCloudData([]);
      return;
    }

    const flavorScores: { [flavor: string]: { totalWeight: number; weightedSum: number } } = {};

    validNotes.forEach(note => {
      const rating = note.rating || 0;
      note.flavors.forEach(flavor => {
        if (!flavorScores[flavor]) {
          flavorScores[flavor] = { totalWeight: 0, weightedSum: 0 };
        }
        flavorScores[flavor].totalWeight += rating;
        flavorScores[flavor].weightedSum += rating * rating;
      });
    });

    const wordCloudData: WordCloudData[] = Object.entries(flavorScores)
      .map(([flavor, scores]) => {
        const formattedName = formatFlavorName(flavor);
        return {
          text: formattedName,
          value: Math.round((scores.weightedSum / scores.totalWeight) * 10) / 10,
          color: getFlavorColor(formattedName)
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 50);

    setWordCloudData(wordCloudData);
  };

  const formatFlavorName = (flavor: string): string => {
    return flavor
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getFlavorColor = (flavorName: string): string => {
    const colorMap: { [key: string]: string } = {
      'green apple': '#22c55e',
      'red apple': '#ef4444',
      'citrus': '#f59e0b',
      'vanilla': '#fbbf24',
      'oak': '#78716c',
      'smoke': '#1f2937',
      'spice': '#dc2626',
    };
    return colorMap[flavorName.toLowerCase()] || '#6366f1';
  };

  const getChartData = () => {
    if (!flavorProfile) return [];
    return [
      { flavor: 'Fruit', value: flavorProfile.fruit, fullMark: 10 },
      { flavor: 'Floral', value: flavorProfile.floral, fullMark: 10 },
      { flavor: 'Oak', value: flavorProfile.oak, fullMark: 10 },
      { flavor: 'Smoke', value: flavorProfile.smoke, fullMark: 10 },
      { flavor: 'Spice', value: flavorProfile.spice, fullMark: 10 },
    ];
  };

  if (authLoading || profileLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Helmet>
        <title>Profile — My Whisky Journey</title>
        <meta name="description" content="View your whisky profile, tasting notes, wishlist, and personalized flavor preferences." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile?.avatar_url || ""} alt="Profile picture" />
            <AvatarFallback className="text-xl">
              {profile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{profile?.first_name || user?.email}</h1>
        </div>
        <div className="flex items-center gap-2">
          {flavorProfile && <ShareProfileButton flavorProfile={flavorProfile} />}
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/reviews')}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Wine className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">My Whiskies</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-muted-foreground">{counts.whiskies}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/reviews')}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Ratings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-muted-foreground">{counts.ratings}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/reviews')}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bookmark className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Wishlist</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-muted-foreground">{counts.wishlist}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Taste Profile Section */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <Wine className="w-12 h-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Your taste profile</CardTitle>
          <CardDescription>
            See how your taste develops reflecting your whisky journey. Set your preferences or just scan and rate whiskies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!flavorProfile ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Start tasting whiskies and rating them to build your unique flavor profile.
              </p>
              <Button onClick={() => navigate('/tasting')}>
                Start Tasting Whiskies
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Radar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={getChartData()}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="flavor" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 10]} 
                      tick={false}
                    />
                    <RechartsRadar
                      name="Intensity"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

            

              {/* Word Cloud */}
              {wordCloudData.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Favorite Tasting Notes</h3>
                  <div className="h-48 bg-muted/20 rounded-lg p-4">
                    <svg width="100%" height="100%">
                      <Wordcloud
                        words={wordCloudData}
                        width={400}
                        height={180}
                        fontSize={(datum) => {
                          const fontScale = scaleLog({
                            domain: [Math.min(...wordCloudData.map(w => w.value)), Math.max(...wordCloudData.map(w => w.value))],
                            range: [8, 24],
                          });
                          return fontScale(datum.value);
                        }}
                        rotate={0}
                        padding={2}
                      >
                        {(cloudWords) =>
                          cloudWords.map((w, i) => {
                            const originalData = wordCloudData.find(d => d.text === w.text);
                            return (
                              <Text
                                key={w.text}
                                fill={originalData?.color || '#6366f1'}
                                textAnchor="middle"
                                transform={`translate(${w.x}, ${w.y})`}
                                fontSize={w.size}
                                fontFamily="Inter, system-ui, sans-serif"
                              >
                                {w.text}
                              </Text>
                            );
                          })
                        }
                      </Wordcloud>
                    </svg>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <WhiskyRecommendations 
                flavorProfile={flavorProfile} 
                userId={user?.id || ''} 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
