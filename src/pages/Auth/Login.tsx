import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
