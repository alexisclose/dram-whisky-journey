import { useTastingFlowState } from "@/hooks/useTastingFlowState";
import { HeroProductView } from "./HeroProductView";
import { RateAndReview } from "./RateAndReview";
import { IntensityStep } from "./IntensityStep";
import { RevealExperience } from "./RevealExperience";

interface TastingFlowSteppedProps {
  whisky: {
    id: string;
    distillery: string;
    name: string;
    region: string;
    image_url: string | null;
  };
  userId: string | null;
  guestSessionId?: string | null;
  communityFlavors: Record<string, number>;
  communityIntensity: Record<string, number>;
  ratingStats: { averageRating: number | null; totalReviews: number };
  onComplete: () => void;
}

// Step progress indicator
const StepProgressDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center justify-center gap-2 py-3">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`rounded-full transition-all duration-300 ${
          i === current
            ? "w-6 h-2 bg-primary"
            : i < current
            ? "w-2 h-2 bg-primary/60"
            : "w-2 h-2 bg-muted"
        }`}
      />
    ))}
  </div>
);

export const TastingFlowStepped = ({
  whisky,
  userId,
  guestSessionId,
  communityFlavors,
  communityIntensity,
  ratingStats,
  onComplete,
}: TastingFlowSteppedProps) => {
  const flow = useTastingFlowState({
    whiskyId: whisky.id,
    userId,
    guestSessionId: guestSessionId || null,
  });

  return (
    <div className="relative min-h-screen bg-background">
      {/* Progress dots — floating overlay, hidden during dial+review (step 1) and reveal (step 3) */}
      {flow.currentStep !== 1 && flow.currentStep !== 3 && (
        <div className="absolute top-3 left-0 right-0 z-40 pointer-events-none">
          <StepProgressDots current={flow.currentStep} total={flow.totalSteps} />
        </div>
      )}

      {/* Step 0: Hero Product View */}
      {flow.currentStep === 0 && (
        <div className="animate-fade-in">
          <HeroProductView
            whisky={whisky}
            ratingStats={ratingStats}
            onRate={() => flow.nextStep()}
          />
        </div>
      )}

      {/* Step 1: Rate + Review (unified Vivino-like screen) */}
      {flow.currentStep === 1 && (
        <RateAndReview
          rating={flow.rating}
          onRatingChange={flow.setRating}
          notes={flow.notes}
          onNotesChange={flow.setNotes}
          selectedFlavors={flow.selectedFlavors}
          onFlavorsChange={flow.setSelectedFlavors}
          communityFlavors={communityFlavors}
          whiskyImageUrl={whisky.image_url}
          whiskyName={`${whisky.distillery} ${whisky.name}`}
          onNext={() => flow.nextStep()}
          onClose={() => flow.prevStep()}
        />
      )}

      {/* Step 2: Intensity Sliders */}
      {flow.currentStep === 2 && (
        <div className="animate-slide-up">
          <IntensityStep
            intensityRatings={flow.intensityRatings}
            onIntensityChange={flow.setIntensityRating}
            onSubmit={async () => {
              try {
                await flow.submitReview();
                flow.nextStep();
              } catch {
                // Error handled by mutation's onError
              }
            }}
            onBack={() => flow.prevStep()}
            isSubmitting={flow.isSubmitting}
          />
        </div>
      )}

      {/* Step 3: Reveal Animation */}
      {flow.currentStep === 3 && (
        <RevealExperience
          whisky={whisky}
          rating={flow.rating!}
          selectedFlavors={flow.selectedFlavors}
          intensityRatings={flow.intensityRatings}
          communityFlavors={communityFlavors}
          communityIntensity={communityIntensity}
          ratingStats={ratingStats}
          onViewDossier={onComplete}
        />
      )}
    </div>
  );
};
