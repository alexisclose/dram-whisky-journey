import { useRef, useCallback, useEffect, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved";

/**
 * A hook that provides auto-save functionality with status indicator.
 * Debounces saves by the specified delay.
 */
export function useAutoSave<T>(
  saveFn: () => Promise<void>,
  delay: number = 500
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        await saveFn();
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
  }, [saveFn, delay]);

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
