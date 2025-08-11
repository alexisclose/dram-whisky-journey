import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "activeSet";

type ActiveSetContextType = {
  activeSet: string;
  setActiveSet: (setCode: string) => void;
  loading: boolean;
};

const ActiveSetContext = createContext<ActiveSetContextType | undefined>(undefined);

export const ActiveSetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthSession();
  const [activeSet, setActiveSetState] = useState<string>(() => localStorage.getItem(LS_KEY) || "classic");
  const [loading, setLoading] = useState<boolean>(false);

  const setActiveSet = (setCode: string) => {
    setActiveSetState(setCode);
    localStorage.setItem(LS_KEY, setCode);
  };

  useEffect(() => {
    const load = async () => {
      if (!user) return; // fall back to localStorage value
      setLoading(true);
      const { data, error } = await supabase
        .from("user_sets")
        .select("set_code, activated_at")
        .eq("user_id", user.id)
        .order("activated_at", { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        setActiveSet(data[0].set_code);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value = useMemo(() => ({ activeSet, setActiveSet, loading }), [activeSet, loading]);

  return (
    <ActiveSetContext.Provider value={value}>{children}</ActiveSetContext.Provider>
  );
};

export const useActiveSet = () => {
  const ctx = useContext(ActiveSetContext);
  if (!ctx) throw new Error("useActiveSet must be used within ActiveSetProvider");
  return ctx;
};
