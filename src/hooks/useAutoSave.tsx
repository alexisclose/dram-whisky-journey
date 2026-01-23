import { useRef, useCallback, useEffect, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved";

/**
 * A hook that provides auto-save functionality with status indicator.
 * Debounces saves by the specified delay.
 * Uses a ref to always call the latest version of saveFn to avoid stale closures.
 */
export function useAutoSave(
  saveFn: () => Promise<void>,
  delay: number = 500
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Always keep the latest saveFn in a ref to avoid stale closures
  const saveFnRef = useRef(saveFn);
  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  const triggerSave = useCallback(() => {
    // Clear any pending save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Clear any "saved" status timeout
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }

    setStatus("saving");

    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      
      isSavingRef.current = true;
      try {
        // Call the latest version of saveFn via the ref
        await saveFnRef.current();
        setStatus("saved");
        // Reset to idle after 2 seconds
        savedTimeoutRef.current = setTimeout(() => {
          setStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setStatus("idle");
      } finally {
        isSavingRef.current = false;
      }
    }, delay);
  }, [delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  return { triggerSave, status };
}
