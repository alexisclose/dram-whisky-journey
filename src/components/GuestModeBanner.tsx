import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface GuestModeBannerProps {
  tastingsCount: number;
}

/**
 * A non-intrusive, mobile-first banner prompting guests to save their tasting notes.
 * Appears at the bottom of the screen with a friendly CTA.
 */
const GuestModeBanner = ({ tastingsCount }: GuestModeBannerProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      <div className="bg-gradient-to-r from-primary/95 to-primary dark:from-primary/90 dark:to-primary/80 backdrop-blur-sm border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="hidden sm:flex h-10 w-10 rounded-full bg-primary-foreground/20 items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-medium text-primary-foreground truncate">
                Liking these drams?
              </p>
              <p className="text-xs sm:text-sm text-primary-foreground/80 truncate">
                {tastingsCount > 0 
                  ? `Save your ${tastingsCount} tasting${tastingsCount > 1 ? 's' : ''} forever`
                  : 'Save your tasting notes forever'
                }
              </p>
            </div>
          </div>
          
          <Button 
            asChild 
            size="sm" 
            variant="secondary"
            className="flex-shrink-0 font-semibold shadow-lg"
          >
            <Link to="/signup">
              Sign Up Free
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestModeBanner;
