import { Helmet } from "react-helmet-async";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp } from "lucide-react";

const Community = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/community` : "/community";
  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>The Global Shelf — Community</title>
        <meta name="description" content="Share whisky discoveries with the community. Upvote favourites and add comments." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">The Global Shelf</h1>

      <Alert className="mb-6">
        <AlertTitle>Heads up</AlertTitle>
        <AlertDescription>
          Posting, upvoting and commenting require Supabase. Connect it to enable full community features. This is a preview of the feed.
        </AlertDescription>
      </Alert>

      <section className="grid gap-6 md:grid-cols-2">
        {[1,2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Lagavulin — 16 Year Old</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Shared by: DramExplorer · ABV 43% · Islay
              <div className="mt-4 flex items-center gap-3">
                <Button size="sm" variant="outline"><ThumbsUp className="mr-2 h-4 w-4" /> Upvote</Button>
                <Button size="sm" variant="ghost"><MessageSquare className="mr-2 h-4 w-4" /> Comment</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
};

export default Community;
