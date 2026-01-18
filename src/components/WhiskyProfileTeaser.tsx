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
  const entries = Object.entries(profile) as [keyof FlavorProfile, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  
  // Calculate variance to detect balanced profiles
  const values = entries.map(([, v]) => v);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  
  // If variance is very low, it's a balanced profile
  if (variance < 1) {
    return "You prefer well-rounded spirits where no single flavor overpowers the rest.";
  }
  
  const primary = sorted[0][0].charAt(0).toUpperCase() + sorted[0][0].slice(1);
  const secondary = sorted[1][0].charAt(0).toUpperCase() + sorted[1][0].slice(1);
  const primaryValue = sorted[0][1];
  const secondaryValue = sorted[1][1];
  
  // Pure profile if primary is significantly higher (>2 points difference)
  const isPure = (primaryValue - secondaryValue) > 2;
  
  // Text mappings
  const pureTexts: Record<string, string> = {
    Smoke: "You prefer uncompromising powerhouses of iodine, ash, and maritime salt.",
    Fruit: "You prefer vibrant explosions of fresh pears, citrus, and sweet confectionary.",
    Oak: "You prefer dry, dignified spirits focused on vanilla and toasted coconut.",
    Floral: "You prefer crisp, clean spirits reminiscent of hay, honeysuckle, and fresh linen.",
    Spice: "You prefer sharp, invigorating profiles defined by black pepper and a long finish."
  };
  
  const comboTexts: Record<string, string> = {
    "Smoke+Fruit": "You prefer sweet and savory profiles where rich smoke is softened by fruit.",
    "Smoke+Oak": "You prefer intense whiskies with heavy char and a robust, earthy backbone.",
    "Smoke+Spice": "You prefer punchy, warming drams mixing peat with a sharp, peppery finish.",
    "Smoke+Floral": "You prefer delicate contrasts where light heather notes float over a campfire base.",
    "Fruit+Oak": "You prefer classic profiles balancing juicy sweetness with deep vanilla wood.",
    "Fruit+Floral": "You prefer bright, summery whiskies bursting with blossoms and green apples.",
    "Fruit+Spice": "You prefer rich, dessert-like whiskies mixing dried fruits with cinnamon.",
    "Oak+Spice": "You prefer structured profiles with dry tannins, dark chocolate, and winter spices.",
    "Oak+Floral": "You prefer sophisticated whiskies where old wood grounds lighter, fragrant aromas.",
    "Floral+Spice": "You prefer aromatic whiskies where herbal notes meet zesty ginger heat."
  };
  
  if (isPure) {
    return pureTexts[primary] || `You prefer ${primary.toLowerCase()}-forward whiskies.`;
  }
  
  // Try both orderings for combo lookup
  const key1 = `${primary}+${secondary}`;
  const key2 = `${secondary}+${primary}`;
  
  return comboTexts[key1] || comboTexts[key2] || `You prefer ${primary.toLowerCase()} and ${secondary.toLowerCase()} notes.`;
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
