import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Box, Trophy } from "lucide-react";

const Tasting = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/tasting` : "/tasting";

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
    </main>
  );
};
export default Tasting;