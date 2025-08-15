import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpenCheck, Globe2, MapPinned, Medal, Radar } from "lucide-react";

const Dashboard = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "/dashboard";
  const tiles = [
    {
      title: "Whisky University",
      desc: "Dive into history, tasting technique, and flavour language.",
      href: "/university",
      icon: BookOpenCheck,
    },
    {
      title: "Tasting Journey",
      desc: "Explore your 12 drams and record your palate and ratings.",
      href: "/tasting",
      icon: MapPinned,
    },
    {
      title: "Master's Quiz",
      desc: "Test your knowledge and earn your title.",
      href: "/quiz",
      icon: Medal,
    },
    {
      title: "My Whisky Profile",
      desc: "View your personalized flavor profile based on your tastings.",
      href: "/profile",
      icon: Radar,
    },
  ];

  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>Dashboard — Dram Discoverer</title>
        <meta name="description" content="Your central hub to learn, taste, share, and test in the Dram Discoverer whisky journey." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Your Whisky Hub</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">Navigate through the journey: complete the University modules, savour each dram, connect with others, and earn your certificate.</p>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map(({ title, desc, href, icon: Icon }) => (
          <Card key={title} className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="text-primary" />
                <CardTitle>{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 min-h-12">{desc}</p>
              <Button asChild variant="brand" size="sm">
                <Link to={href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <aside className="mt-10 text-sm text-muted-foreground">
        Progress saving, community posts, and certificates require connecting Supabase. We'll enable these once connected.
      </aside>
    </main>
  );
};

export default Dashboard;
