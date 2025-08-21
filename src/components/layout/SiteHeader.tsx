
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Settings } from "lucide-react";
import { useState } from "react";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
  }`;

const SiteHeader = () => {
  const { user, loading } = useAuthSession();
  const { isAdmin } = useUserRole();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Logged out");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-6">
          <Link to="/" className="font-bold tracking-tight text-base sm:text-lg">
            Dram Discoverer
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
            <NavLink className={navLinkClass} to="/feed">Feed</NavLink>
            <NavLink className={navLinkClass} to="/discover">Discover</NavLink>
            <NavLink className={navLinkClass} to="/tasting">Tasting Journey</NavLink>
            <NavLink className={navLinkClass} to="/explore">Explore</NavLink>
            {!loading && user && (
              <>
                <NavLink className={navLinkClass} to="/profile">Profile</NavLink>
                {isAdmin && (
                  <NavLink className={navLinkClass} to="/whisky-upload">Upload</NavLink>
                )}
              </>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Menu</h2>
                </div>
                
                <nav className="flex flex-col gap-2">
                  <NavLink 
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                    to="/feed"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Feed
                  </NavLink>
                  <NavLink 
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                    to="/discover"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Discover
                  </NavLink>
                  <NavLink 
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                    to="/tasting"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tasting Journey
                  </NavLink>
                  <NavLink 
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                    to="/explore"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Explore
                  </NavLink>
                  
                  {!loading && user && (
                    <>
                      <div className="border-t my-2"></div>
                      <NavLink 
                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Profile
                      </NavLink>
                      {isAdmin && (
                        <NavLink 
                          className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                          to="/whisky-upload"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Upload
                        </NavLink>
                      )}
                      <NavLink 
                        className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                        to="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </NavLink>
                    </>
                  )}
                </nav>
                
                <div className="border-t pt-4 mt-4">
                  {!loading && !user && (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="ghost" className="justify-start">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                      </Button>
                      <Button asChild variant="brand" className="justify-start">
                        <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Sign up</Link>
                      </Button>
                    </div>
                  )}
                  {!loading && user && (
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-muted-foreground px-3 py-1 truncate">
                        @{profile?.username || user.email}
                      </div>
                      <Button 
                        variant="ghost" 
                        className="justify-start"
                        onClick={() => {
                          navigate("/settings");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                      <Button 
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }} 
                        variant="outline" 
                        className="justify-start"
                      >
                        Log out
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {!loading && !user && (
              <>
                <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild variant="brand" size="sm" className="text-xs sm:text-sm">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            )}
            {!loading && user && (
              <>
                <span className="hidden xl:inline text-xs sm:text-sm text-muted-foreground mr-1 truncate max-w-32">
                  @{profile?.username || user.email}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/settings")}
                  className="text-xs sm:text-sm"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm" className="text-xs sm:text-sm">
                  Log out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
