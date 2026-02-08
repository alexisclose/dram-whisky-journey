import { Helmet } from "react-helmet-async";
import { useActiveSet } from "@/context/ActiveSetContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GlassWater, Sparkles } from "lucide-react";
import OnboardingSteps from "@/components/OnboardingSteps";
import { Card } from "@/components/ui/card";

const Welcome = () => {
  const { activeSet } = useActiveSet();
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/welcome` : "/welcome";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <Helmet>
        <title>Welcome — Dram Discoverer</title>
        <meta name="description" content="Welcome to your whisky tasting journey. Discover, taste, and learn." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="max-w-lg mx-auto w-full">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <GlassWater className="h-10 w-10 text-primary" />
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">You're All Set!</h1>
          
          <p className="text-muted-foreground text-lg">
            Your <span className="font-semibold text-foreground capitalize">{activeSet}</span> tasting set is ready to explore.
          </p>
        </div>

        {/* Journey preview */}
        <Card className="p-6 mb-8">
          <h2 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wider">Your Journey</h2>
          <OnboardingSteps currentStep={0} />
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link to="/my-tasting-box">
              <GlassWater className="mr-2 h-5 w-5" />
              Start Tasting
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/signup">Create Account to Save Progress</Link>
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Welcome;
