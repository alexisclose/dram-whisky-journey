import { Check, GlassWater, Star, Radar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  completed?: boolean;
}

interface OnboardingStepsProps {
  currentStep?: number;
  className?: string;
}

const OnboardingSteps = ({ currentStep = 0, className }: OnboardingStepsProps) => {
  const steps: Step[] = [
    {
      icon: <GlassWater className="h-5 w-5" />,
      title: "Explore Your Set",
      description: "Discover each whisky in your curated collection",
      completed: currentStep > 0,
    },
    {
      icon: <Star className="h-5 w-5" />,
      title: "Rate & Note",
      description: "Record your impressions and flavor discoveries",
      completed: currentStep > 1,
    },
    {
      icon: <Radar className="h-5 w-5" />,
      title: "Build Your Profile",
      description: "See your unique taste preferences emerge",
      completed: currentStep > 2,
    },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <div 
          key={index}
          className={cn(
            "flex items-start gap-4 p-4 rounded-lg transition-colors",
            index === currentStep && "bg-primary/5 border border-primary/20",
            step.completed && "opacity-70"
          )}
        >
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
            step.completed 
              ? "bg-primary text-primary-foreground" 
              : index === currentStep 
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
          )}>
            {step.completed ? <Check className="h-5 w-5" /> : step.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium",
              step.completed && "line-through text-muted-foreground"
            )}>
              {step.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OnboardingSteps;
