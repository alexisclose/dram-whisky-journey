import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useActiveSet } from "@/context/ActiveSetContext";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Activate = () => {
  const canonical = typeof window !== "undefined" ? `${window.location.origin}/activate` : "/activate";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setActiveSet } = useActiveSet();
  const { user } = useAuthSession();

  const handleActivate = async () => {
    if (!code.trim()) {
      toast.info("Enter your activation code");
      return;
    }
    try {
      setLoading(true);
      const { data: ac, error } = await supabase
        .from("activation_codes")
        .select("set_code, name, is_active")
        .eq("code", code.trim())
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!ac) {
        toast.error("Invalid or inactive code");
        return;
      }

      const setCode = ac.set_code as string;

      if (user) {
        const { error: insErr } = await supabase
          .from("user_sets")
          .insert({ user_id: user.id, set_code: setCode });
        if (insErr && !String(insErr.message || "").includes("duplicate key")) throw insErr;
      }

      setActiveSet(setCode);
      toast.success(`Activated: ${ac.name || setCode}`);
      navigate("/tasting");
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Activation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-6 py-10">
      <Helmet>
        <title>Activate Tasting Set — Enter Code</title>
        <meta name="description" content="Activate your whisky tasting set by entering your code to unlock the correct drams." />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">Activate Your Tasting Set</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Enter Activation Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              placeholder="e.g., JPN-2025"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Codes map to a tasting set (e.g., classic or japanese). Once activated, your Tasting Journey will show the right drams.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleActivate} disabled={loading}>
            {loading ? "Activating..." : "Activate"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
};

export default Activate;
