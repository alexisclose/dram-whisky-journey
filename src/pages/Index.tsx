import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SignatureGlow from "@/components/SignatureGlow";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useActiveSet } from "@/context/ActiveSetContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MyTastingBox from "./MyTastingBox";

const Index = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
  const { user, loading: authLoading } = useAuthSession();
  const [code, setCode] = useState("");
  const [activating, setActivating] = useState(false);
  const navigate = useNavigate();
  const { setActiveSet } = useActiveSet();

  const handleActivate = async () => {
    if (!code.trim()) {
      toast.info("Enter your activation code");
      return;
    }
    try {
      setActivating(true);
      const { data, error } = await supabase.rpc(
        'validate_activation_code' as any,
        { _code: code.trim() } as any
      );
      if (error) throw error;
      const result = Array.isArray(data) ? (data[0] as any) : null;
      if (!result || !result.valid) {
        toast.error("Invalid or inactive code");
        return;
      }
      const setCode = result.set_code as string;
      setActiveSet(setCode);
      toast.success(`Set activated: ${result.name || setCode}`);
      navigate("/welcome");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Activation failed");
    } finally {
      setActivating(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <main className="min-h-[88vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </main>
    );
  }

  // If logged in, show MyTastingBox as home
  if (user) {
    return <MyTastingBox />;
  }

  // If not logged in, show welcome with set activation
  return (
    <>
      <Helmet>
        <title>Dram Discoverer | Interactive Whisky Journey</title>
        <meta name="description" content="Start your interactive whisky journey across 12 curated drams. Learn, taste, join the community, and earn your certificate." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <main className="relative min-h-[88vh] flex items-center justify-center overflow-hidden px-4">
        <SignatureGlow />
        <section className="container mx-auto py-12 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 px-2">
            The Whisky Explorer— Your Interactive Whisky Journey
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground mb-8 sm:mb-10 px-4">
            Explore a curated set of 12 whiskies: study the craft, taste with confidence, join the global shelf, ace the master's quiz, and unlock your certificate.
          </p>

          {/* Set Activation Card */}
          <Card className="max-w-md mx-auto mb-8">
            <CardHeader>
              <CardTitle>Activate Your Tasting Set</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-left">
                <Label htmlFor="code">Activation Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., JPN-2025"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleActivate()}
                />
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Enter the code from your tasting set to unlock your curated whisky journey.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleActivate} disabled={activating} className="w-full">
                {activating ? "Activating..." : "Activate Set"}
              </Button>
            </CardFooter>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;
