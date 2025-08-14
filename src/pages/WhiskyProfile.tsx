import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Radar, Cloud } from "lucide-react";
import { Radar as RechartsRadar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import ReactWordcloud from 'react-wordcloud';
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

const WhiskyProfile = () => {
  const { user, loading } = useAuthSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tastingNotes, setTastingNotes] = useState<TastingNote[]>([]);
  const [flavorProfile, setFlavorProfile] = useState<FlavorProfile | null>(null);
  const [wordCloudData, setWordCloudData] = useState<WordCloudData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    if (user) {
      fetchTastingNotes();
    }
  }, [user, loading, navigate]);

  const fetchTastingNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('tasting_notes')
        .select('id, rating, intensity_ratings, whisky_id, flavors')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error fetching tasting notes:', error);
        toast({
          title: "Error",
          description: "Failed to load your tasting notes",
          variant: "destructive",
        });
        return;
      }

      setTastingNotes(data || []);
      calculateFlavorProfile(data || []);
      calculateWordCloudData(data || []);
    } catch (error) {
      console.error('Error fetching tasting notes:', error);
      toast({
        title: "Error",
        description: "Failed to load your tasting notes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFlavorProfile = (notes: TastingNote[]) => {
    // Filter notes that have both rating and intensity ratings
    const validNotes = notes.filter(note => 
      note.rating !== null && 
      note.intensity_ratings && 
      typeof note.intensity_ratings === 'object'
    );

    if (validNotes.length === 0) {
      setFlavorProfile(null);
      return;
    }

    // Convert slider values (0-4) to numerical scale (0-10)
    const convertSliderToScore = (sliderValue: number): number => {
      const mapping = [0, 2.5, 5, 7.5, 10];
      return mapping[sliderValue] || 0;
    };

    // Calculate weighted averages for each flavor
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
    // Filter notes that have both rating and flavors
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

    // Calculate weighted scores for each flavor
    const flavorScores: { [flavor: string]: { totalWeight: number; weightedSum: number } } = {};

    validNotes.forEach(note => {
      const rating = note.rating || 0;
      note.flavors.forEach(flavor => {
        if (!flavorScores[flavor]) {
          flavorScores[flavor] = { totalWeight: 0, weightedSum: 0 };
        }
        flavorScores[flavor].totalWeight += rating;
        flavorScores[flavor].weightedSum += rating * rating; // Square for more emphasis on high ratings
      });
    });

    // Convert to word cloud format with proper formatting
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
      .slice(0, 50); // Limit to top 50 flavors

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
      // Fruits - Various fruit colors
      'green apple': '#22c55e',
      'red apple': '#ef4444',
      'citrus': '#f59e0b',
      'lemon': '#eab308',
      'orange': '#ea580c',
      'banana': '#eab308',
      'pear': '#84cc16',
      'apricot': '#f97316',
      'peach': '#fb923c',
      'cherry': '#dc2626',
      'grape': '#7c3aed',
      'dried fruit': '#92400e',
      'raisin': '#451a03',
      'fig': '#7c2d12',
      
      // Floral - Light, delicate colors
      'rose': '#f43f5e',
      'lavender': '#a855f7',
      'violet': '#8b5cf6',
      'jasmine': '#fbbf24',
      'honeysuckle': '#fde047',
      
      // Spices - Warm, earthy colors
      'cinnamon': '#a16207',
      'nutmeg': '#92400e',
      'clove': '#451a03',
      'black pepper': '#374151',
      'white pepper': '#6b7280',
      'ginger': '#d97706',
      'cardamom': '#65a30d',
      'allspice': '#7c2d12',
      
      // Oak/Wood - Brown tones
      'vanilla': '#fbbf24',
      'caramel': '#a16207',
      'toffee': '#92400e',
      'butterscotch': '#d97706',
      'honey': '#f59e0b',
      'maple': '#a16207',
      'oak': '#78716c',
      'cedar': '#a3a3a3',
      'sandalwood': '#d6d3d1',
      
      // Smoke/Peat - Dark colors
      'smoke': '#1f2937',
      'peat': '#374151',
      'ash': '#6b7280',
      'coal': '#111827',
      'tar': '#000000',
      'bonfire': '#451a03',
      
      // Nuts - Brown/tan colors
      'almond': '#d6d3d1',
      'walnut': '#78716c',
      'hazelnut': '#a3a3a3',
      'pecan': '#92400e',
      'coconut': '#f3f4f6',
      
      // Chocolate/Coffee - Dark browns
      'chocolate': '#451a03',
      'dark chocolate': '#1c0701',
      'coffee': '#44403c',
      'espresso': '#292524',
      'cocoa': '#7c2d12',
      
      // Herbs - Green tones
      'mint': '#059669',
      'eucalyptus': '#10b981',
      'thyme': '#16a34a',
      'rosemary': '#15803d',
      'sage': '#166534',
      
      // Other
      'leather': '#78716c',
      'tobacco': '#92400e',
      'rubber': '#374151',
      'medicinal': '#dc2626',
      'iodine': '#7c3aed',
      'salt': '#e5e7eb',
      'butter': '#fbbf24',
      'cream': '#fef3c7',
    };

    const lowerName = flavorName.toLowerCase();
    return colorMap[lowerName] || '#6366f1'; // Default color if not found
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your whisky profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Your Whisky Profile</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Discover your unique flavor preferences
            </p>
          </div>
        </div>

        {!flavorProfile ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <Radar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle>No Profile Data Yet</CardTitle>
              <CardDescription>
                Start tasting whiskies and rating them to build your unique flavor profile. 
                Your profile is created based on your star ratings and intensity slider preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/tasting')}>
                Start Tasting Whiskies
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radar className="h-5 w-5" />
                  Your Flavor Profile
                </CardTitle>
                <CardDescription>
                  Based on {tastingNotes.filter(n => n.rating && n.intensity_ratings).length} rated whiskies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={getChartData()}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="flavor" />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 10]} 
                        tick={false}
                      />
                      <RechartsRadar
                        name="Intensity"
                        dataKey="value"
                        stroke="hsl(var(--orange-400))"
                        fill="hsl(var(--orange-400))"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
                  {Object.entries(flavorProfile).map(([flavor, value]) => (
                    <div key={flavor} className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {value.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {flavor}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">How Your Profile Works</h3>
                  <p className="text-sm text-muted-foreground">
                    Your flavor profile is calculated using a weighted average of your intensity slider 
                    ratings, where whiskies you rated higher have more influence on your overall profile. 
                    This creates a mathematical representation of your palate preferences.
                  </p>
                </div>
              </CardContent>
            </Card>

            {wordCloudData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Your Favorite Tasting Notes
                  </CardTitle>
                  <CardDescription>
                    Word cloud of your most appreciated flavors, sized by weighted ratings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ReactWordcloud
                      words={wordCloudData}
                      options={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSizes: [14, 60],
                        rotations: 0, // Keep all text horizontal
                        rotationAngles: [0, 0], // Ensure horizontal orientation
                        scale: 'sqrt',
                        spiral: 'archimedean',
                        transitionDuration: 500,
                        padding: 4,
                        deterministic: true,
                      }}
                    />
                  </div>
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">How Your Word Cloud Works</h3>
                    <p className="text-sm text-muted-foreground">
                      The size of each word represents how much you enjoy that flavor, calculated using 
                      weighted averages based on your star ratings. Words from higher-rated whiskies 
                      appear larger, showing your most appreciated tasting notes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <WhiskyRecommendations 
              flavorProfile={flavorProfile} 
              userId={user?.id || ''} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default WhiskyProfile;