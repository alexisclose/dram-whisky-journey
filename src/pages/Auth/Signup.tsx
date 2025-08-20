import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

const Signup = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/signup` : "/signup";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthSession();

  if (user) {
    // Already logged in, send to dashboard
    navigate("/dashboard");
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Helmet>
        <title>Sign Up — Dram Discoverer</title>
        <meta name="description" content="Create your account to save progress across learning, tasting, and the quiz." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 text-center">Create your account</h1>

      <form
        className="max-w-md mx-auto space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (loading) return;
          const formData = new FormData(e.currentTarget as HTMLFormElement);
          const email = String(formData.get("email") ?? "");
          const password = String(formData.get("password") ?? "");
          const username = String(formData.get("username") ?? "").trim();
          
          if (!email || !password || !username) {
            toast.error("Please fill in all fields.");
            return;
          }
          
          // Basic username validation
          if (username.length < 3) {
            toast.error("Username must be at least 3 characters long.");
            return;
          }
          
          if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            toast.error("Username can only contain letters, numbers, hyphens, and underscores.");
            return;
          }
          
          setLoading(true);
          const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: { username, display_name: username },
            },
          });
          setLoading(false);
          if (error) {
            if (error.message.includes('profiles_username_unique')) {
              toast.error("Username is already taken. Please choose a different one.");
            } else {
              toast.error(error.message);
            }
            return;
          }
          if (data.session) {
            toast.success("Account created! You're logged in.");
            navigate("/dashboard");
          } else {
            toast.info("Account created. Check your email to confirm your address.");
            navigate("/login");
          }
        }}
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
        <div>
          <Label htmlFor="username">Username</Label>
          <Input 
            id="username" 
            name="username" 
            type="text" 
            required 
            placeholder="Choose a unique username" 
            className="mt-1"
            pattern="[a-zA-Z0-9_-]+"
            title="Username can only contain letters, numbers, hyphens, and underscores"
          />
        </div>
        <Button type="submit" variant="brand" size="lg" className="w-full min-h-[44px]" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Already have an account? <Link to="/login" className="underline font-medium">Log in</Link>
        </p>
      </form>
    </main>
  );
};

export default Signup;