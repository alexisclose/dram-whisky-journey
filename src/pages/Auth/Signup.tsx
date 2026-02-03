import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useGuestDataMigration } from "@/hooks/useGuestDataMigration";
import { GUEST_SESSION_KEY } from "@/hooks/useGuestSession";

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil", "Bulgaria",
  "Cambodia", "Canada", "Chile", "China", "Colombia", "Croatia", "Czech Republic", "Denmark",
  "Ecuador", "Egypt", "Estonia", "Finland", "France", "Georgia", "Germany", "Ghana", "Greece",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Lithuania", "Luxembourg",
  "Malaysia", "Mexico", "Morocco", "Netherlands", "New Zealand", "Norway", "Pakistan", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Singapore",
  "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland",
  "Taiwan", "Thailand", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
];

const Signup = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/signup` : "/signup";
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    country: "",
    agreedToTerms: false,
    agreedToPrivacy: false
  });
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

  const handleOAuthSignup = async () => {
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
      toast.error("Failed to sign up with Google");
    } finally {
      setOauthLoading(null);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.username || !formData.password || !formData.country) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (!formData.agreedToTerms) {
      toast.error("Please agree to the Terms and Conditions.");
      return;
    }

    if (!formData.agreedToPrivacy) {
      toast.error("Please agree to the Privacy Policy.");
      return;
    }

    // Username validation
    if (formData.username.length < 3) {
      toast.error("Username must be at least 3 characters long.");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      toast.error("Username can only contain letters, numbers, hyphens, and underscores.");
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/` : "/";
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: formData.username,
            display_name: `${formData.firstName} ${formData.lastName}`,
            first_name: formData.firstName,
            last_name: formData.lastName,
            country: formData.country,
            agreed_to_terms: formData.agreedToTerms,
            agreed_to_privacy: formData.agreedToPrivacy,
          },
        },
      });
      
      if (error) {
        if (error.message.includes('profiles_username_unique')) {
          toast.error("Username is already taken. Please choose a different one.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      if (data.session && data.user) {
        // Migrate guest data immediately
        await migrateGuestData(data.user.id);
        toast.success("Account created! You're logged in.");
        navigate("/my-tasting-box", { replace: true });
      } else {
        toast.info("Account created. Check your email to confirm your address.");
        navigate("/login");
      }
    } catch (error) {
      toast.error("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Helmet>
        <title>Sign Up — Dram Discoverer</title>
        <meta name="description" content="Create your account to save progress across learning, tasting, and the quiz." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div className="max-w-md mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-center">Create your account</h1>
        
        {/* Show message if user has guest data */}
        {hasGuestData && (
          <p className="text-center text-sm text-primary mb-6">
            ✨ Your tasting notes will be saved when you sign up!
          </p>
        )}

        {/* OAuth Buttons */}
        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleOAuthSignup}
            disabled={!!oauthLoading}
          >
            {oauthLoading === 'google' ? (
              "Signing up with Google..."
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

        {/* Email Signup Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input 
                id="firstName" 
                type="text" 
                required 
                placeholder="John" 
                className="mt-1"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input 
                id="lastName" 
                type="text" 
                required 
                placeholder="Doe" 
                className="mt-1"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              placeholder="you@example.com" 
              className="mt-1"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="username">Username *</Label>
            <Input 
              id="username" 
              type="text" 
              required 
              placeholder="Choose a unique username" 
              className="mt-1"
              pattern="[a-zA-Z0-9_-]+"
              title="Username can only contain letters, numbers, hyphens, and underscores"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="mt-1"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => setFormData({...formData, agreedToTerms: !!checked})}
              />
              <Label htmlFor="terms" className="text-sm">
                I agree to the{" "}
                <Link to="/terms" className="text-primary hover:underline">
                  Terms and Conditions
                </Link>
                {" *"}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="privacy" 
                checked={formData.agreedToPrivacy}
                onCheckedChange={(checked) => setFormData({...formData, agreedToPrivacy: !!checked})}
              />
              <Label htmlFor="privacy" className="text-sm">
                I agree to the{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                {" *"}
              </Label>
            </div>
          </div>

          <Button type="submit" variant="brand" size="lg" className="w-full min-h-[44px]" disabled={loading}>
            {loading ? "Creating account..." : hasGuestData ? "Create Account & Save Tastings" : "Create Account"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default Signup;
