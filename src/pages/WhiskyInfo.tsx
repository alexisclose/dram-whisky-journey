import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const WhiskyInfo = () => {
  const { id } = useParams<{ id: string }>();
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/whisky-info/${id}` : `/whisky-info/${id}`;

  const { data: whisky, isLoading } = useQuery({
    queryKey: ["whisky-info", id],
    queryFn: async () => {
      if (!id) throw new Error("Whisky ID is required");
      
      const { data, error } = await supabase
        .from("whiskies")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded mb-6 w-1/2"></div>
          <div className="h-4 bg-muted rounded mb-4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </main>
    );
  }

  if (!whisky) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl font-bold mb-4">Whisky Not Found</h1>
        <p className="text-muted-foreground mb-6">The whisky you're looking for doesn't exist.</p>
        <Button asChild variant="outline">
          <Link to="/my-tasting-box">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasting Box
          </Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 max-w-4xl">
      <Helmet>
        <title>{whisky.distillery} {whisky.name} — Whisky Information</title>
        <meta name="description" content={`Learn about ${whisky.distillery} ${whisky.name} from ${whisky.region}. ${whisky.overview || 'Discover the story behind this exceptional whisky.'}`} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/my-tasting-box">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasting Box
          </Link>
        </Button>
        
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          {whisky.distillery}
        </h1>
        <h2 className="text-xl sm:text-2xl text-muted-foreground mb-4">
          {whisky.name}
        </h2>
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
          <span className="flex items-center gap-1">
            <strong>Region:</strong> {whisky.region}
          </span>
          {whisky.location && (
            <span className="flex items-center gap-1">
              <strong>Location:</strong> {whisky.location}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:gap-8">
        <Card>
          <CardHeader>
            <CardTitle>About This Whisky</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {whisky.overview ? (
              <p className="text-muted-foreground leading-relaxed">
                {whisky.overview}
              </p>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                {whisky.distillery} {whisky.name} is a distinctive whisky from the {whisky.region} region of Japan. 
                This expression showcases the unique character and craftsmanship that defines {whisky.distillery}'s 
                approach to whisky making. Each sip tells a story of tradition, innovation, and the terroir that 
                makes Japanese whisky so exceptional.
              </p>
            )}
            
            {(whisky.pairs_well_with_a || whisky.pairs_well_with_b || whisky.pairs_well_with_c) && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Pairs Well With</h3>
                <div className="flex flex-wrap gap-2">
                  {[whisky.pairs_well_with_a, whisky.pairs_well_with_b, whisky.pairs_well_with_c]
                    .filter(Boolean)
                    .map((pairing, index) => (
                      <span key={index} className="px-3 py-1 bg-background rounded-full text-sm">
                        {pairing}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {whisky.image_url && (
          <Card>
            <CardContent className="p-0">
              <img 
                src={whisky.image_url} 
                alt={`${whisky.distillery} ${whisky.name}`}
                className="w-full h-64 sm:h-80 object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Ready to Begin Your Tasting Journey?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Now that you know more about this whisky, it's time to experience it firsthand. 
              The tasting dossier will guide you through a comprehensive tasting experience 
              where you can record your impressions, rate flavors, and add personal notes.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to={`/tasting/${whisky.id}`}>
                <Play className="mr-2 h-4 w-4" />
                Start Tasting
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default WhiskyInfo;