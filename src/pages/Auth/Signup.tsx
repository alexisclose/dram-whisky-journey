import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Signup = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/signup` : "/signup";
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
        onSubmit={(e) => {
          e.preventDefault();
          toast.info("Connect Supabase to enable secure email/password signups.");
        }}
      >
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required placeholder="you@example.com" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required placeholder="••••••••" />
        </div>
        <div>
          <Label htmlFor="nickname">Public Nickname</Label>
          <Input id="nickname" type="text" required placeholder="What should we call you?" />
        </div>
        <Button type="submit" variant="brand" size="lg" className="w-full">Sign Up</Button>
        <p className="text-sm text-muted-foreground">Already have an account? <Link to="/login" className="underline">Log in</Link></p>
      </form>
    </main>
  );
};

export default Signup;
