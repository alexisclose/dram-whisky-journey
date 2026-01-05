import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { supabase } from "@/integrations/supabase/client";

const LS_KEY = "activeSet";
const LS_ALL_SETS_KEY = "allActiveSets";

type UserSet = {
  set_code: string;
  activated_at: string;
};

type ActiveSetContextType = {
  activeSet: string;
  allSets: UserSet[];
  setActiveSet: (setCode: string) => void;
  addSet: (setCode: string) => void;
  loading: boolean;
};

const ActiveSetContext = createContext<ActiveSetContextType | undefined>(undefined);

export const ActiveSetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthSession();
  const [activeSet, setActiveSetState] = useState<string>(() => localStorage.getItem(LS_KEY) || "classic");
  const [allSets, setAllSets] = useState<UserSet[]>(() => {
    try {
      const stored = localStorage.getItem(LS_ALL_SETS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState<boolean>(false);

  const setActiveSet = (setCode: string) => {
    setActiveSetState(setCode);
    localStorage.setItem(LS_KEY, setCode);
  };

  const addSet = (setCode: string) => {
    const newSet: UserSet = { set_code: setCode, activated_at: new Date().toISOString() };
    setAllSets(prev => {
      // Don't add duplicates
      if (prev.some(s => s.set_code === setCode)) return prev;
      const updated = [...prev, newSet];
      localStorage.setItem(LS_ALL_SETS_KEY, JSON.stringify(updated));
      return updated;
    });
    setActiveSet(setCode);
  };

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      
      // Fetch ALL user sets, not just the most recent one
      const { data, error } = await supabase
        .from("user_sets")
        .select("set_code, activated_at")
        .eq("user_id", user.id)
        .order("activated_at", { ascending: false });
      
      if (!error && data && data.length > 0) {
        setAllSets(data);
        localStorage.setItem(LS_ALL_SETS_KEY, JSON.stringify(data));
        // Set most recently activated as the current active set
        setActiveSet(data[0].set_code);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const value = useMemo(() => ({ 
    activeSet, 
    allSets, 
    setActiveSet, 
    addSet, 
    loading 
  }), [activeSet, allSets, loading]);

  return (
    <ActiveSetContext.Provider value={value}>{children}</ActiveSetContext.Provider>
  );
};

export const useActiveSet = () => {
  const ctx = useContext(ActiveSetContext);
  if (!ctx) throw new Error("useActiveSet must be used within ActiveSetProvider");
  return ctx;
};
