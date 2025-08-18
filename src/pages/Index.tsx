import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SignatureGlow from "@/components/SignatureGlow";

const Index = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
  
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
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4">
            <Button asChild variant="hero" size="xl" className="w-full sm:w-auto">
              <Link to="/signup">Start the Journey</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/dashboard">Explore the Hub</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;