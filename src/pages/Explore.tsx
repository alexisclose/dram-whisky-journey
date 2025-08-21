import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search, Filter, MapPin, Plus } from "lucide-react";

type WhiskyRow = {
  id: string;
  distillery: string;
  name: string;
  region: string;
  location?: string;
  region_location?: string;
  image_url?: string;
  overview?: string;
  expert_score_fruit?: number;
  expert_score_floral?: number;
  expert_score_spice?: number;
  expert_score_smoke?: number;
  expert_score_oak?: number;
  pairs_well_with_a?: string;
  pairs_well_with_b?: string;
  pairs_well_with_c?: string;
  set_code: string;
  created_at: string;
  is_user_submitted?: boolean;
  user_id?: string;
  review_text?: string;
  rating?: number;
};

const Explore = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Map regions to country flags  
  const getCountryFlag = (region: string): string => {
    const countryFlags: { [key: string]: string } = {
      'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'Ireland': '🇮🇪',
      'Japan': '🇯🇵',
      'USA': '🇺🇸',
      'Canada': '🇨🇦',
      'India': '🇮🇳',
      'Taiwan': '🇹🇼',
      'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Australia': '🇦🇺',
      'France': '🇫🇷',
      'Germany': '🇩🇪',
      'Netherlands': '🇳🇱',
      'Sweden': '🇸🇪',
      'Finland': '🇫🇮',
      'Denmark': '🇩🇰',
      'South Africa': '🇿🇦',
      'Brazil': '🇧🇷',
      'Argentina': '🇦🇷',
      'Chile': '🇨🇱',
      'New Zealand': '🇳🇿',
      'Mexico': '🇲🇽',
      'Israel': '🇮🇱',
      'Czech Republic': '🇨🇿',
      'Austria': '🇦🇹',
      'Switzerland': '🇨🇭',
      'Belgium': '🇧🇪',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Turkey': '🇹🇷',
      'China': '🇨🇳',
      'South Korea': '🇰🇷',
      'Thailand': '🇹🇭',
      'Pakistan': '🇵🇰',
      'Tasmania': '🇦🇺', // Tasmania is part of Australia
      'Kentucky': '🇺🇸', // Kentucky is in USA
      'Tennessee': '🇺🇸', // Tennessee is in USA
      'Speyside': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Speyside is in Scotland
      'Highlands': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Highlands is in Scotland
      'Islay': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Islay is in Scotland
      'Lowlands': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Lowlands is in Scotland
      'Campbeltown': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Campbeltown is in Scotland
      'Islands': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', // Islands (Scottish) is in Scotland
    };
    return countryFlags[region] || '🌍'; // Default to world emoji if region not found
  };

  const formatLocation = (whisky: WhiskyRow): string => {
    const parts = [];
    if (whisky.location) parts.push(whisky.location);
    if (whisky.region) parts.push(whisky.region);
    return parts.join(', ');
  };

  const { data: whiskies, isLoading } = useQuery({
    queryKey: ["explore-whiskies"],
    queryFn: async () => {
      // Fetch regular whiskies
      const { data: regularWhiskies, error: regularError } = await supabase
        .from("whiskies")
        .select("*")
        .order("distillery", { ascending: true });
      
      if (regularError) throw regularError;

      // Fetch user-submitted whiskies
      const { data: userWhiskies, error: userError } = await supabase
        .from("user_whiskies")
        .select("*")
        .order("distillery", { ascending: true });
      
      if (userError) throw userError;

      // Combine and format both types
      const allWhiskies: WhiskyRow[] = [
        ...(regularWhiskies || []).map(w => ({ ...w, is_user_submitted: false })),
        ...(userWhiskies || []).map(w => ({ 
          ...w, 
          is_user_submitted: true,
          overview: w.review_text,
          set_code: 'user-submitted'
        }))
      ];

      return allWhiskies.sort((a, b) => a.distillery.localeCompare(b.distillery));
    },
  });

  // Get unique regions for filter
  const uniqueRegions = whiskies 
    ? [...new Set(whiskies.map(w => w.region))].sort()
    : [];

  // Filter whiskies based on search and filters
  const filteredWhiskies = whiskies?.filter(whisky => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = searchTerm === "" || 
      whisky.name?.toLowerCase().includes(searchLower) ||
      whisky.distillery?.toLowerCase().includes(searchLower) ||
      whisky.region?.toLowerCase().includes(searchLower) ||
      whisky.location?.toLowerCase().includes(searchLower) ||
      whisky.region_location?.toLowerCase().includes(searchLower);

    const matchesRegion = selectedRegion === "all" || whisky.region === selectedRegion;

    return matchesSearch && matchesRegion;
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Explore Whiskies - Discover Your Next Dram</title>
        <meta name="description" content="Explore our comprehensive collection of whiskies from around the world. Search by region, distillery, or ABV to find your perfect whisky." />
        <meta name="keywords" content="whisky, whiskey, explore, collection, Scotland, Ireland, Japan, bourbon" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Explore Whiskies</h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-4 sm:mb-6 px-2">
            Discover our complete collection of whiskies from around the world
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
            {/*<p className="text-muted-foreground text-sm sm:text-base">
              {whiskies?.length || 0} whiskies available • {filteredWhiskies.length} shown
            </p>*/}
            <Button asChild className="w-full sm:w-auto">
              <Link to="/add-whisky">
                <Plus className="w-4 h-4 mr-2" />
                Add Your Whisky
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name, distillery, or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Region Filter */}
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {uniqueRegions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {/* Active Filters */}
          {(searchTerm || selectedRegion !== "all") && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchTerm("")}>
                  Search: "{searchTerm}" ×
                </Badge>
              )}
              {selectedRegion !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setSelectedRegion("all")}>
                  Region: {selectedRegion} ×
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {filteredWhiskies.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No whiskies found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedRegion("all");
              }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredWhiskies.map((whisky) => (
              <Card key={whisky.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {whisky.name}
                      </CardTitle>
                      <CardDescription className="text-base font-medium">
                        {whisky.distillery}
                      </CardDescription>
                      {whisky.is_user_submitted && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Community Added
                        </Badge>
                      )}
                    </div>
                    {whisky.image_url && (
                      <img 
                        src={whisky.image_url} 
                        alt={`${whisky.distillery} ${whisky.name}`}
                        className="w-12 h-16 object-contain"
                      />
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    {formatLocation(whisky)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {whisky.overview && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {whisky.overview}
                    </p>
                  )}
                  
                  {whisky.is_user_submitted && whisky.rating && (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-muted-foreground">User Rating: </span>
                      <span className="text-xs">{whisky.rating}/5 ⭐</span>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button asChild size="sm">
                      <Link to={`/whisky-dossier/${whisky.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Explore;
