import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useGuestDataMigration } from "@/hooks/useGuestDataMigration";
import { GUEST_SESSION_KEY } from "@/hooks/useGuestSession";

const Login = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const { user } = useAuthSession();
  const { migrateGuestData } = useGuestDataMigration();

  // Check if there's guest data to migrate
  const hasGuestData = typeof window !== "undefined" && !!localStorage.getItem(GUEST_SESSION_KEY);

  // Handle user becoming authenticated (including OAuth redirects)
  useEffect(() => {
    const handleAuth = async () => {
      if (user) {
        // Migrate guest data if any exists
        await migrateGuestData(user.id);
        // Navigate to their tasting box
        navigate("/my-tasting-box", { replace: true });
      }
    };
    handleAuth();
  }, [user, migrateGuestData, navigate]);

  const handleOAuthLogin = async () => {
    setOauthLoading('google');
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("Failed to log in with Google");
    } finally {
      setOauthLoading(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    
    if (error) {
      toast.error(error.message);
      return;
    }
    
    // Migrate guest data if user just logged in
    if (data.user) {
      await migrateGuestData(data.user.id);
    }
    
    toast.success("Logged in!");
    navigate("/my-tasting-box", { replace: true });
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Helmet>
        <title>Log In — Dram Discoverer</title>
        <meta name="description" content="Log in to your Dram Discoverer account to continue your whisky journey." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">Welcome back</h1>
      
      {/* Show message if user has guest data */}
      {hasGuestData && (
        <p className="text-center text-sm text-primary mb-6">
          ✨ Your tasting notes will be saved when you log in!
        </p>
      )}

      <div className="max-w-md mx-auto">
        {/* OAuth Buttons */}
        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleOAuthLogin}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'google' ? (
              "Logging in with Google..."
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
      </div>

      <form
        className="max-w-md mx-auto space-y-4"
        onSubmit={handleLogin}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            required 
            placeholder="you@example.com" 
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input 
            id="password" 
            name="password" 
            type="password" 
            required 
            placeholder="••••••••" 
            className="mt-1"
          />
        </div>
        <Button type="submit" variant="brand" size="lg" className="w-full min-h-[44px]" disabled={loading}>
          {loading ? "Logging in..." : hasGuestData ? "Log In & Save Tastings" : "Log In"}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          No account yet? <Link to="/signup" className="underline font-medium">Create one</Link>
        </p>
      </form>
    </main>
  );
};

export default Login;
