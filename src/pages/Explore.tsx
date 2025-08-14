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
import { Search, Filter, MapPin } from "lucide-react";

type WhiskyRow = {
  id: string;
  distillery: string;
  name: string;
  region: string;
  abv: number | null;
  lat: number | null;
  lng: number | null;
  expert_nose: string | null;
  expert_palate: string | null;
  expert_finish: string | null;
  description: string | null;
  image_url: string | null;
  set_code: string;
};

const Explore = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [abvRange, setAbvRange] = useState<string>("all");

  const { data: whiskies, isLoading } = useQuery({
    queryKey: ["explore-whiskies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whiskies")
        .select("*")
        .order("distillery", { ascending: true });
      
      if (error) throw error;
      return data as WhiskyRow[];
    },
  });

  // Get unique regions for filter
  const uniqueRegions = whiskies 
    ? [...new Set(whiskies.map(w => w.region))].sort()
    : [];

  // Filter whiskies based on search and filters
  const filteredWhiskies = whiskies?.filter(whisky => {
    const matchesSearch = searchTerm === "" || 
      whisky.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      whisky.distillery.toLowerCase().includes(searchTerm.toLowerCase()) ||
      whisky.region.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = selectedRegion === "all" || whisky.region === selectedRegion;

    const matchesAbv = abvRange === "all" || (whisky.abv && (
      (abvRange === "low" && whisky.abv < 43) ||
      (abvRange === "medium" && whisky.abv >= 43 && whisky.abv < 50) ||
      (abvRange === "high" && whisky.abv >= 50)
    ));

    return matchesSearch && matchesRegion && matchesAbv;
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
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Explore Whiskies</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Discover our complete collection of whiskies from around the world
          </p>
          <p className="text-muted-foreground">
            {whiskies?.length || 0} whiskies available • {filteredWhiskies.length} shown
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
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

            {/* ABV Filter */}
            <Select value={abvRange} onValueChange={setAbvRange}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="All ABV" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ABV</SelectItem>
                <SelectItem value="low">Under 43%</SelectItem>
                <SelectItem value="medium">43% - 50%</SelectItem>
                <SelectItem value="high">Over 50%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(searchTerm || selectedRegion !== "all" || abvRange !== "all") && (
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
              {abvRange !== "all" && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setAbvRange("all")}>
                  ABV: {abvRange === "low" ? "Under 43%" : abvRange === "medium" ? "43% - 50%" : "Over 50%"} ×
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
                setAbvRange("all");
              }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWhiskies.map((whisky) => (
              <Card key={whisky.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {whisky.distillery}
                      </CardTitle>
                      <CardDescription className="text-base font-medium">
                        {whisky.name}
                      </CardDescription>
                    </div>
                    {whisky.image_url && (
                      <img 
                        src={whisky.image_url} 
                        alt={`${whisky.distillery} ${whisky.name}`}
                        className="w-12 h-16 object-contain"
                      />
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" />
                      {whisky.region}
                    </Badge>
                    {whisky.abv && (
                      <Badge variant="outline" className="text-xs">
                        {whisky.abv}% ABV
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {whisky.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {whisky.description}
                    </p>
                  )}
                  
                  {(whisky.expert_nose || whisky.expert_palate || whisky.expert_finish) && (
                    <div className="space-y-2 mb-4">
                      {whisky.expert_nose && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Nose: </span>
                          <span className="text-xs line-clamp-2">{whisky.expert_nose}</span>
                        </div>
                      )}
                      {whisky.expert_palate && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Palate: </span>
                          <span className="text-xs line-clamp-2">{whisky.expert_palate}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      {whisky.lat && whisky.lng && (
                        <span>
                          {whisky.lat.toFixed(3)}, {whisky.lng.toFixed(3)}
                        </span>
                      )}
                    </div>
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