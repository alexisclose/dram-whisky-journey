import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Login = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/login` : "/login";
  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>Log In — Dram Discoverer</title>
        <meta name="description" content="Log in to your Dram Discoverer account to continue your whisky journey." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">Welcome back</h1>

      <form
        className="max-w-md space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast.info("Connect Supabase to enable secure email/password login.");
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
        <Button type="submit" variant="brand" size="lg" className="w-full">Log In</Button>
        <p className="text-sm text-muted-foreground">No account yet? <Link to="/signup" className="underline">Create one</Link></p>
      </form>
    </main>
  );
};

export default Login;
