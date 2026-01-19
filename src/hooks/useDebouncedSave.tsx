import { useRef, useCallback, useEffect } from "react";

/**
 * A hook that provides debounced save functionality.
 * Perfect for auto-saving text inputs without API spam.
 */
export function useDebouncedSave<T>(
  saveFn: (value: T) => Promise<void>,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestValueRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);

  const debouncedSave = useCallback(
    (value: T) => {
      latestValueRef.current = value;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        if (isSavingRef.current) return;
        
        isSavingRef.current = true;
        try {
          await saveFn(value);
        } finally {
          isSavingRef.current = false;
        }
      }, delay);
    },
    [saveFn, delay]
  );

  // Cancel pending saves on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const cancelPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const flushNow = useCallback(async () => {
    cancelPending();
    if (latestValueRef.current !== null && !isSavingRef.current) {
      isSavingRef.current = true;
      try {
        await saveFn(latestValueRef.current);
      } finally {
        isSavingRef.current = false;
      }
    }
  }, [saveFn, cancelPending]);

  return { debouncedSave, cancelPending, flushNow };
}
