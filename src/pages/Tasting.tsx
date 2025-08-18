import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { BookOpen, Box, Trophy } from "lucide-react";
import { useActiveSet } from "@/context/ActiveSetContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Tasting = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/tasting` : "/tasting";
  const { activeSet, loading, setActiveSet } = useActiveSet();
  const { user } = useAuthSession();
  const [showActivation, setShowActivation] = useState(false);
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);

  // Reset showActivation when activeSet changes (successful activation)
  useEffect(() => {
    if (activeSet && activeSet !== "classic") {
      setShowActivation(false);
    }
  }, [activeSet]);

  const handleActivate = async () => {
    if (!code.trim()) {
      toast.info("Enter your activation code");
      return;
    }
    if (!user) {
      toast.error("Please log in to activate your set");
      return;
    }
    try {
      setActivating(true);
      const { data, error } = await supabase.rpc(
        'activate_with_code' as any,
        { _code: code.trim() } as any
      );
      if (error) throw error;
      const result = Array.isArray(data) ? (data[0] as any) : null;
      if (!result || !result.set_code) {
        toast.error("Invalid or inactive code");
        return;
      }

      const activatedSetCode = result.set_code as string;
      setActiveSet(activatedSetCode);
      toast.success(`Activated: ${result.name || activatedSetCode}`);
      setCode("");
      setShowActivation(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Activation failed");
    } finally {
      setActivating(false);
    }
  };

  // If user is not logged in or hasn't activated a set, show activation page
  if (!user || (!loading && activeSet === "classic") || showActivation) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Helmet>
          <title>Activate Tasting Set — Enter Code</title>
          <meta name="description" content="Activate your whisky tasting set by entering your code to unlock the correct drams." />
          <link rel="canonical" href={canonical} />
        </Helmet>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">Activate Your Tasting Set</h1>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Enter Activation Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g., JPN-2025"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Codes map to a tasting set (e.g., classic or japanese). Once activated, your Tasting Journey will show the right drams.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleActivate} disabled={activating}>
              {activating ? "Activating..." : "Activate"}
            </Button>
            {showActivation && (
              <Button variant="ghost" onClick={() => setShowActivation(false)} className="ml-2">
                Cancel
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    );
  }

  // Show loading state while checking active set
  if (loading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="text-center">Loading...</div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Helmet>
        <title>Tasting Journey — Choose Your Path</title>
        <meta name="description" content="Choose your tasting journey: Whisky University, My Tasting Box, or Master's Quiz." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">The Tasting Journey</h1>
      <p className="text-muted-foreground mb-8 sm:mb-12 text-center text-sm sm:text-base max-w-2xl mx-auto">
        Choose your path to whisky mastery. Learn, taste, and test your knowledge.
      </p>

      <section className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto">
        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Whisky University</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm sm:text-base">
              Learn about whisky production, history, and tasting techniques through our comprehensive educational content.
            </p>
            <Button asChild className="w-full">
              <Link to="/university">Start Learning</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Box className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">My Tasting Box</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm sm:text-base">
              Explore your curated set of 12 whiskies. Rate them, open dossiers, and record your tasting notes.
            </p>
            <Button asChild className="w-full">
              <Link to="/my-tasting-box">Open My Box</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Master's Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm sm:text-base">
              Test your whisky knowledge and earn your certificate. Challenge yourself with expert-level questions.
            </p>
            <Button asChild className="w-full">
              <Link to="/quiz">Take Quiz</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <div className="mt-8 sm:mt-12 text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground text-sm"
          onClick={() => setShowActivation(true)}
        >
          Activate Another Set
        </Button>
      </div>
    </main>
  );
};
export default Tasting;