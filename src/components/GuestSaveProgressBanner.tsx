import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

interface GuestSaveProgressBannerProps {
  ratingsCount: number;
}

/**
 * A dismissible sticky footer banner for guests, prompting them to sign up.
 */
const GuestSaveProgressBanner = ({ ratingsCount }: GuestSaveProgressBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || ratingsCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom">
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-700 dark:to-amber-800 backdrop-blur-sm border-t border-amber-500/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {ratingsCount} {ratingsCount === 1 ? 'whisky' : 'whiskies'} rated. Save your progress
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              asChild 
              size="sm" 
              variant="secondary"
              className="font-semibold shadow-lg"
            >
              <Link to="/signup">
                Sign Up
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestSaveProgressBanner;
