
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
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>Sign Up — Dram Discoverer</title>
        <meta name="description" content="Create your account to save progress across learning, tasting, and the quiz." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">Create your account</h1>

      <form
        className="max-w-md space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (loading) return;
          const formData = new FormData(e.currentTarget as HTMLFormElement);
          const email = String(formData.get("email") ?? "");
          const password = String(formData.get("password") ?? "");
          const nickname = String(formData.get("nickname") ?? "");
          if (!email || !password || !nickname) {
            toast.error("Please fill in all fields.");
            return;
          }
          setLoading(true);
          const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectUrl,
              data: { nickname },
            },
          });
          setLoading(false);
          if (error) {
            toast.error(error.message);
            return;
          }
          if (data.session) {
            toast.success("Account created! You’re logged in.");
            navigate("/dashboard");
          } else {
            toast.info("Account created. Check your email to confirm your address.");
            navigate("/login");
          }
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>
        <div>
          <Label htmlFor="nickname">Public Nickname</Label>
          <Input id="nickname" name="nickname" type="text" required placeholder="What should we call you?" />
        </div>
        <Button type="submit" variant="brand" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="underline">Log in</Link>
        </p>
      </form>
    </main>
  );
};

export default Signup;
