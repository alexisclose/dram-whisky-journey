import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, BookOpenCheck, MapPinned, Medal } from "lucide-react";

const Certificate = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/certificate` : "/certificate";
  const checklist = [
    { label: "Viewed all Whisky University modules", href: "/university" },
    { label: "Rated all 12 whiskies in the Tasting Journey", href: "/tasting" },
    { label: "Completed the Master's Quiz", href: "/quiz" },
  ];

  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>Certificate — Unlock Your Reward</title>
        <meta name="description" content="Complete learning, tasting, and the quiz to unlock your personalised certificate of completion." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">Completion & Reward</h1>
      <p className="text-muted-foreground mb-6">Your personalised certificate unlocks when all steps are complete. Progress tracking activates once Supabase is connected.</p>

      <ul className="space-y-3">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-muted-foreground" />
              <span>{item.label}</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to={item.href}>Go</Link>
            </Button>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Button asChild variant="outline"><Link to="/university"><BookOpenCheck className="mr-2 h-4 w-4" /> University</Link></Button>
        <Button asChild variant="outline"><Link to="/tasting"><MapPinned className="mr-2 h-4 w-4" /> Tasting</Link></Button>
        <Button asChild variant="outline"><Link to="/quiz"><Medal className="mr-2 h-4 w-4" /> Quiz</Link></Button>
      </div>
    </main>
  );
};

export default Certificate;
