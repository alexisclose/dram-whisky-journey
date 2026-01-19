import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const GUEST_SESSION_KEY = "dram_guest_session_id";

interface GuestSessionState {
  guestSessionId: string | null;
  isGuest: boolean;
  clearGuestSession: () => void;
  getOrCreateGuestSessionId: () => string;
}

/**
 * Hook to manage guest session ID stored in localStorage.
 * Guests get a UUID that persists their tasting data until they sign up.
 */
export function useGuestSession(isAuthenticated: boolean): GuestSessionState {
  const [guestSessionId, setGuestSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(GUEST_SESSION_KEY);
  });

  // When user becomes authenticated, they're no longer a guest
  const isGuest = !isAuthenticated && guestSessionId !== null;

  const getOrCreateGuestSessionId = useCallback((): string => {
    let sessionId = localStorage.getItem(GUEST_SESSION_KEY);
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem(GUEST_SESSION_KEY, sessionId);
      setGuestSessionId(sessionId);
    }
    return sessionId;
  }, []);

  const clearGuestSession = useCallback(() => {
    localStorage.removeItem(GUEST_SESSION_KEY);
    setGuestSessionId(null);
  }, []);

  // Sync state with localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(GUEST_SESSION_KEY);
    if (stored !== guestSessionId) {
      setGuestSessionId(stored);
    }
  }, []);

  return {
    guestSessionId,
    isGuest,
    clearGuestSession,
    getOrCreateGuestSessionId,
  };
}

export { GUEST_SESSION_KEY };
