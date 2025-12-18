import { Helmet } from "react-helmet-async";
import { useActiveSet } from "@/context/ActiveSetContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GlassWater } from "lucide-react";

const Welcome = () => {
  const { activeSet } = useActiveSet();
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/welcome` : "/welcome";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <Helmet>
        <title>Welcome — Dram Discoverer</title>
        <meta name="description" content="Welcome to your whisky tasting journey. Discover, taste, and learn." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <GlassWater className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Welcome to Your Tasting Journey</h1>
          <p className="text-muted-foreground text-lg">
            Your tasting set <span className="font-medium text-foreground">{activeSet}</span> is ready. 
            Explore your curated collection of whiskies.
          </p>
        </div>

        <div className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link to="/my-tasting-box">Start Tasting</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/login">Sign in to save progress</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Welcome;
