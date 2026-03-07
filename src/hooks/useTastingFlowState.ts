import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getGuestClient } from "@/integrations/supabase/guestClient";
import { toast } from "sonner";
import { DEFAULT_INTENSITY } from "@/constants/tasting";

interface UseTastingFlowStateOptions {
  whiskyId: string;
  userId: string | null;
  guestSessionId: string | null;
}

export function useTastingFlowState({ whiskyId, userId, guestSessionId }: UseTastingFlowStateOptions) {
  const queryClient = useQueryClient();
  const totalSteps = 4; // 0=hero, 1=dial+review, 2=intensity, 3=reveal

  // Step navigation
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [rating, setRating] = useState<number | null>(2.5); // Default like Vivino
  const [notes, setNotes] = useState("");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [intensityRatings, setIntensityRatings] = useState<Record<string, number>>({ ...DEFAULT_INTENSITY });

  const nextStep = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
  }, []);

  const toggleFlavor = useCallback((key: string) => {
    setSelectedFlavors((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  }, []);

  const setIntensityRating = useCallback((axis: string, value: number) => {
    setIntensityRatings((prev) => ({ ...prev, [axis]: value }));
  }, []);

  // Per-step validation
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return true; // Hero — always can proceed
      case 1: return rating !== null && selectedFlavors.length > 0; // Dial+Review — must rate and pick flavors
      case 2: return true; // Intensity — defaults are fine
      default: return false;
    }
  }, [currentStep, rating, selectedFlavors]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (userId) {
        const noteData = {
          user_id: userId,
          whisky_id: whiskyId,
          rating,
          note: notes || null,
          flavors: selectedFlavors,
          intensity_ratings: intensityRatings,
        };
        const { error } = await supabase.from("tasting_notes").upsert(noteData, {
          onConflict: "user_id,whisky_id",
        });
        if (error) throw error;
      } else if (guestSessionId) {
        const client = getGuestClient(guestSessionId);
        const noteData = {
          guest_session_id: guestSessionId,
          whisky_id: whiskyId,
          rating,
          note: notes || null,
          flavors: selectedFlavors,
          intensity_ratings: intensityRatings,
        };
        const { error } = await client.from("tasting_notes").upsert(noteData, {
          onConflict: "guest_session_id,whisky_id",
        });
        if (error) throw error;
      } else {
        throw new Error("No user or guest session");
      }
    },
    onSuccess: () => {
      toast.success("Tasting note saved!");
      queryClient.invalidateQueries({ queryKey: ["user-note"] });
      queryClient.invalidateQueries({ queryKey: ["community-flavors"] });
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["whisky-in-tasting-box"] });
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast.error("Failed to save tasting note");
    },
  });

  const submitReview = useCallback(async () => {
    await saveMutation.mutateAsync();
  }, [saveMutation]);

  return {
    currentStep,
    totalSteps,
    rating,
    notes,
    selectedFlavors,
    intensityRatings,
    setRating,
    setNotes,
    setSelectedFlavors,
    setIntensityRating,
    toggleFlavor,
    nextStep,
    prevStep,
    goToStep,
    submitReview,
    canProceed,
    isSubmitting: saveMutation.isPending,
  };
}
