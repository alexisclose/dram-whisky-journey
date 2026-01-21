import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSet } from "@/context/ActiveSetContext";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SetEntry = () => {
  const { setCode } = useParams<{ setCode: string }>();
  const navigate = useNavigate();
  const { addSet } = useActiveSet();
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");

  useEffect(() => {
    const validateAndActivate = async () => {
      if (!setCode) {
        setStatus("error");
        return;
      }

      // First, try to validate as an activation code
      const { data: activationData } = await supabase
        .rpc("validate_activation_code", { _code: setCode });

      if (activationData && activationData.length > 0 && activationData[0].valid) {
        // Valid activation code - use the associated set_code
        addSet(activationData[0].set_code);
        setStatus("success");
        setTimeout(() => navigate("/welcome", { replace: true }), 500);
        return;
      }

      // Fallback: Check if the code is a valid set_code directly (from whisky_sets)
      const { data: setData } = await supabase
        .from("whisky_sets")
        .select("set_code")
        .eq("set_code", setCode.toLowerCase())
        .limit(1);

      if (setData && setData.length > 0) {
        // Valid set_code - activate directly
        addSet(setData[0].set_code);
        setStatus("success");
        setTimeout(() => navigate("/welcome", { replace: true }), 500);
        return;
      }

      // Neither activation code nor set_code found
      setStatus("error");
    };

    validateAndActivate();
  }, [setCode, addSet, navigate]);

  if (status === "loading") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Validating your tasting set...</p>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Invalid Code</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          The QR code you scanned doesn't match an active tasting set. Please check your booklet and try again.
        </p>
        <Button onClick={() => navigate("/")} variant="outline">
          Go to Home
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg">Preparing your experience...</p>
    </main>
  );
};

export default SetEntry;
