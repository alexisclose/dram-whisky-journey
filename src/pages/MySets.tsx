import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ChevronRight, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useActiveSet } from "@/context/ActiveSetContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "@/components/EmptyState";
import OnboardingSteps from "@/components/OnboardingSteps";

const MySets = () => {
  const { allSets, setActiveSet, loading } = useActiveSet();
  const navigate = useNavigate();

  // Get whisky counts per set
  const { data: whiskyCounts } = useQuery({
    queryKey: ["whisky-counts-per-set", allSets.map(s => s.set_code).join(",")],
    queryFn: async () => {
      if (allSets.length === 0) return {};
      
      const { data, error } = await supabase
        .from("whisky_sets")
        .select("set_code, whisky_id")
        .in("set_code", allSets.map(s => s.set_code));
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      (data || []).forEach(row => {
        counts[row.set_code] = (counts[row.set_code] || 0) + 1;
      });
      return counts;
    },
    enabled: allSets.length > 0
  });

  const handleSelectSet = (setCode: string) => {
    setActiveSet(setCode);
    navigate("/my-tasting-box");
  };

  const hasNoSets = allSets.length === 0;

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Helmet>
        <title>My Sets — Choose Your Tasting Experience</title>
        <meta name="description" content="Select which whisky set you want to explore." />
      </Helmet>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">My Sets</h1>
      <p className="text-muted-foreground mb-6 text-sm sm:text-base">
        Choose a set to explore its whiskies
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : hasNoSets ? (
        <div className="max-w-xl mx-auto">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-8">
                <EmptyState
                  icon={Package}
                  title="Start Your Whisky Journey"
                  description="Activate your tasting set to unlock a curated collection of whiskies waiting to be explored."
                  action={{
                    label: "Activate a Set",
                    href: "/activate",
                  }}
                  size="lg"
                  className="py-4"
                />
              </div>
              <div className="p-6 border-t">
                <h3 className="font-medium text-sm text-muted-foreground mb-4 uppercase tracking-wider">What's Next</h3>
                <OnboardingSteps currentStep={0} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {allSets.map((set) => (
              <Card 
                key={set.set_code} 
                className="cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={() => handleSelectSet(set.set_code)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="capitalize text-lg">
                        {set.set_code}
                      </CardTitle>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-muted-foreground">
                    {whiskyCounts?.[set.set_code] || 0} whiskies
                  </span>
                </CardContent>
              </Card>
            ))}
          </section>

          <Button asChild variant="outline" className="gap-2">
            <Link to="/activate">
              <Plus className="h-4 w-4" />
              Activate Another Set
            </Link>
          </Button>
        </>
      )}
    </main>
  );
};

export default MySets;
