import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Sparkles } from "lucide-react";
import { INTENSITY_AXES, INTENSITY_LABELS } from "@/constants/tasting";

interface IntensityStepProps {
  intensityRatings: Record<string, number>;
  onIntensityChange: (axis: string, value: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export const IntensityStep = ({
  intensityRatings,
  onIntensityChange,
  onSubmit,
  onBack,
  isSubmitting,
}: IntensityStepProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">Intensity</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-lg flex-1">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold font-heading mb-2">How intense are the flavors?</h2>
          <p className="text-muted-foreground text-sm">
            Slide each axis to describe the whisky's character
          </p>
        </div>

        <div className="space-y-8">
          {INTENSITY_AXES.map((axis, index) => (
            <div key={axis.key} className="space-y-3 animate-slide-up" style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">{axis.label}</span>
                <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {INTENSITY_LABELS[intensityRatings[axis.key]] || "medium"}
                </span>
              </div>
              <Slider
                value={[intensityRatings[axis.key]]}
                onValueChange={(value) => onIntensityChange(axis.key, value[0])}
                max={4}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>none</span>
                <span>medium</span>
                <span>pronounced</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t px-4 py-4">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full h-14 text-lg font-semibold rounded-xl gap-2"
          size="lg"
        >
          {isSubmitting ? (
            "Saving..."
          ) : (
            <>
              See how you compare
              <Sparkles className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
