import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SignatureGlow from "@/components/SignatureGlow";
const Index = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
  return <>
      <Helmet>
        <title>Dram Discoverer | Interactive Whisky Journey</title>
        <meta name="description" content="Start your interactive whisky journey across 12 curated drams. Learn, taste, join the community, and earn your certificate." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <main className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        <SignatureGlow />
        <section className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">The  Whisky Explorer— Your Interactive Whisky Journey</h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
            Explore a curated set of 12 whiskies: study the craft, taste with confidence, join the global shelf, ace the master’s quiz, and unlock your certificate.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild variant="hero" size="xl">
              <Link to="/signup">Start the Journey</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/dashboard">Explore the Hub</Link>
            </Button>
          </div>
        </section>
      </main>
    </>;
};
export default Index;