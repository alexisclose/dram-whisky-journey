import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlavorProfile {
  fruit: number;
  floral: number;
  oak: number;
  smoke: number;
  spice: number;
}

interface WhiskyRecommendation {
  whisky_id: string;
  distillery: string;
  name: string;
  region: string;
  location: string | null;
  image_url: string | null;
  overview: string | null;
  expert_score_fruit: number | null;
  expert_score_floral: number | null;
  expert_score_spice: number | null;
  expert_score_smoke: number | null;
  expert_score_oak: number | null;
  similarity_score: number;
  similarity_percentage: number;
}

interface WhiskyRecommendationsProps {
  flavorProfile: FlavorProfile | null;
  userId: string;
}

const WhiskyRecommendations = ({ flavorProfile, userId }: WhiskyRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<WhiskyRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (flavorProfile && userId) {
      fetchRecommendations();
    }
  }, [flavorProfile, userId]);

  const fetchRecommendations = async () => {
    if (!flavorProfile) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_whisky_recommendations', {
        _user_id: userId,
        _fruit_score: flavorProfile.fruit,
        _floral_score: flavorProfile.floral,
        _spice_score: flavorProfile.spice,
        _smoke_score: flavorProfile.smoke,
        _oak_score: flavorProfile.oak,
        _limit: 8
      });

      if (error) {
        console.error('Error fetching recommendations:', error);
        toast({
          title: "Error",
          description: "Failed to load recommendations",
          variant: "destructive",
        });
        return;
      }

      // Filter out recommendations with very low similarity (< 10%)
      const filteredRecommendations = data?.filter(rec => rec.similarity_percentage >= 10) || [];
      setRecommendations(filteredRecommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMatchDescription = (percentage: number) => {
    if (percentage >= 85) return "Exceptional match - This whisky aligns perfectly with your preferences";
    if (percentage >= 70) return "Great match - Strong alignment with your flavor profile";
    if (percentage >= 55) return "Good match - Similar flavor characteristics to your preferences";
    if (percentage >= 40) return "Moderate match - Some shared flavor elements";
    return "Light match - Few shared flavor characteristics";
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 85) return "bg-green-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 55) return "bg-orange-500";
    if (percentage >= 40) return "bg-yellow-500";
    return "bg-gray-500";
  };

  if (!flavorProfile) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommended for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Finding your perfect matches...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Recommended for You
          </CardTitle>
          <CardDescription>
            Based on your flavor profile using cosine similarity matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Info className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No recommendations available</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any whiskies that match your profile that you haven't already tried.
            </p>
            <Button onClick={() => navigate('/explore')}>
              Explore All Whiskies
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Recommended for You
        </CardTitle>
        <CardDescription>
          Whiskies matched to your flavor profile using cosine similarity • Showing {recommendations.length} matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {recommendations.map((whisky) => (
            <div
              key={whisky.whisky_id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/whisky/${whisky.whisky_id}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{whisky.distillery}</h3>
                  <p className="text-xs text-muted-foreground">{whisky.name}</p>
                  <p className="text-xs text-muted-foreground">{whisky.region}</p>
                </div>
                <Badge 
                  className={`${getMatchColor(whisky.similarity_percentage)} text-white text-xs px-2 py-1`}
                >
                  {whisky.similarity_percentage}% MATCH
                </Badge>
              </div>
              
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {getMatchDescription(whisky.similarity_percentage)}
                </p>
                
                {/* Expert scores visualization */}
                <div className="grid grid-cols-5 gap-1 text-xs">
                  {[
                    { label: 'Fruit', value: whisky.expert_score_fruit },
                    { label: 'Floral', value: whisky.expert_score_floral },
                    { label: 'Spice', value: whisky.expert_score_spice },
                    { label: 'Smoke', value: whisky.expert_score_smoke },
                    { label: 'Oak', value: whisky.expert_score_oak },
                  ].map((score) => (
                    <div key={score.label} className="text-center">
                      <div className="text-xs font-medium text-primary">
                        {score.value || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {score.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button size="sm" variant="ghost" className="text-xs">
                  View Details <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            How Recommendations Work
          </h3>
          <p className="text-sm text-muted-foreground">
            We use cosine similarity to match your flavor profile with expert tasting notes. 
            This mathematical approach identifies whiskies with similar flavor balances, 
            even if the overall intensity differs. Higher percentages indicate better matches.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhiskyRecommendations;