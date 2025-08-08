import { Helmet } from "react-helmet-async";
import { WHISKIES } from "@/data/whiskies";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Tasting = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/tasting` : "/tasting";
  const [ratings, setRatings] = useState<Record<number, number>>({});

  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>Tasting Journey — Explore 12 Drams</title>
        <meta name="description" content="Browse your curated set of 12 whiskies. Open dossiers, record your palate and add ratings as you taste." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">The Tasting Journey</h1>
      <p className="text-muted-foreground mb-6">Map and dossiers coming soon. Start by browsing the set and adding quick ratings.</p>

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {WHISKIES.map((w) => (
          <Card key={w.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{w.distillery} — {w.name}</span>
                <span className="text-sm text-muted-foreground">{w.region}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              ABV {w.abv}% · Lat {w.lat.toFixed(2)} · Lng {w.lng.toFixed(2)}
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((n) => (
                  <button
                    key={n}
                    aria-label={`Rate ${n} star`}
                    className={`p-1 rounded ${ratings[w.id] && ratings[w.id] >= n ? "text-primary" : "text-muted-foreground"}`}
                    onClick={() => setRatings((r) => ({ ...r, [w.id]: n }))}
                  >
                    <Star className="h-5 w-5" fill={ratings[w.id] && ratings[w.id] >= n ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/tasting/${w.id}`} aria-label={`Open dossier for ${w.distillery} ${w.name}`}>
                  Open Dossier
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>

      <aside className="mt-10 text-sm text-muted-foreground">
        Saving ratings and palate notes will be enabled once Supabase is connected.
      </aside>
    </main>
  );
};

export default Tasting;
