import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Sparkles, TrendingUp } from "lucide-react";

interface FlavorProfile {
  fruit: number;
  floral: number;
  oak: number;
  smoke: number;
  spice: number;
}

interface WhiskyProfileTeaserProps {
  flavorProfile: FlavorProfile | null;
  tastingsCount: number;
}

const getTopFlavors = (profile: FlavorProfile): string[] => {
  const entries = Object.entries(profile) as [keyof FlavorProfile, number][];
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([flavor]) => flavor.charAt(0).toUpperCase() + flavor.slice(1));
};

const getInsight = (profile: FlavorProfile): string => {
  const topFlavors = getTopFlavors(profile);
  const descriptors: Record<string, string> = {
    Fruit: "fruity",
    Floral: "delicate",
    Oak: "rich",
    Smoke: "bold",
    Spice: "complex"
  };

  const flavor1 = descriptors[topFlavors[0]] || topFlavors[0].toLowerCase();
  const flavor2 = descriptors[topFlavors[1]] || topFlavors[1].toLowerCase();
  
  return `You prefer ${flavor1}, ${flavor2} notes`;
};

const WhiskyProfileTeaser = ({ flavorProfile, tastingsCount }: WhiskyProfileTeaserProps) => {
  if (!flavorProfile || tastingsCount < 1) {
    return null;
  }

  const topFlavors = getTopFlavors(flavorProfile);
  const insight = getInsight(flavorProfile);

  return (
    <Link to="/profile" className="block">
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">Your Profile So Far</span>
              </div>
              
              <p className="text-sm sm:text-base font-medium text-foreground mb-2 truncate">
                {insight}
              </p>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Based on {tastingsCount} tasting{tastingsCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              {/* Mini radar preview */}
              <div className="hidden sm:flex items-center gap-1.5">
                {topFlavors.map((flavor, i) => (
                  <span 
                    key={flavor}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
                  >
                    {flavor}
                  </span>
                ))}
              </div>
              
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default WhiskyProfileTeaser;
