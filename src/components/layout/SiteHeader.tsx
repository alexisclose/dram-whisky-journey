import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
  }`;

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold tracking-tight text-lg">
            Dram Discoverer
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            <NavLink className={navLinkClass} to="/dashboard">Hub</NavLink>
            <NavLink className={navLinkClass} to="/university">Whisky University</NavLink>
            <NavLink className={navLinkClass} to="/tasting">Tasting Journey</NavLink>
            <NavLink className={navLinkClass} to="/community">Global Shelf</NavLink>
            <NavLink className={navLinkClass} to="/quiz">Master's Quiz</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild variant="brand" size="sm">
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
