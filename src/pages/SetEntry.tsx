import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSet } from "@/context/ActiveSetContext";
import { Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SetEntry = () => {
  const { setCode } = useParams<{ setCode: string }>();
  const navigate = useNavigate();
  const { setActiveSet } = useActiveSet();
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");

  useEffect(() => {
    const validateAndActivate = async () => {
      if (!setCode) {
        setStatus("error");
        return;
      }

      // Use the public RPC function to validate the code
      const { data, error } = await supabase
        .rpc("validate_activation_code", { _code: setCode });

      if (error || !data || data.length === 0 || !data[0].valid) {
        setStatus("error");
        return;
      }

      // Valid code - store the associated set_code and redirect to welcome
      setActiveSet(data[0].set_code);
      setStatus("success");
      
      // Brief delay to show success, then redirect
      setTimeout(() => {
        navigate("/welcome", { replace: true });
      }, 500);
    };

    validateAndActivate();
  }, [setCode, setActiveSet, navigate]);

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
