import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GUEST_SESSION_KEY } from "./useGuestSession";

/**
 * Hook to handle migrating guest tasting data to a registered user account.
 * Call this after successful authentication/signup.
 */
export function useGuestDataMigration() {
  const migrateGuestData = useCallback(async (newUserId: string): Promise<boolean> => {
    const guestSessionId = localStorage.getItem(GUEST_SESSION_KEY);
    
    if (!guestSessionId) {
      // No guest data to migrate
      return false;
    }

    try {
      const { data, error } = await supabase.rpc("migrate_guest_data", {
        guest_id: guestSessionId,
        new_user_id: newUserId,
      });

      if (error) {
        console.error("Failed to migrate guest data:", error);
        toast.error("Could not merge your previous tastings");
        return false;
      }

      const migratedCount = data as number;
      
      // Clear the guest session from localStorage
      localStorage.removeItem(GUEST_SESSION_KEY);

      if (migratedCount > 0) {
        toast.success(`Past tastings merged! (${migratedCount} tasting${migratedCount > 1 ? 's' : ''})`);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Migration error:", err);
      return false;
    }
  }, []);

  return { migrateGuestData };
}
