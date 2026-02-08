import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "brand";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) => {
  const sizeClasses = {
    sm: {
      container: "py-8",
      icon: "h-12 w-12",
      iconContainer: "w-16 h-16",
      title: "text-lg",
      description: "text-sm",
    },
    md: {
      container: "py-12",
      icon: "h-10 w-10",
      iconContainer: "w-20 h-20",
      title: "text-xl",
      description: "text-base",
    },
    lg: {
      container: "py-16",
      icon: "h-12 w-12",
      iconContainer: "w-24 h-24",
      title: "text-2xl",
      description: "text-lg",
    },
  };

  const sizes = sizeClasses[size];

  const renderAction = (actionConfig: EmptyStateAction, isSecondary = false) => {
    const variant = actionConfig.variant || (isSecondary ? "outline" : "default");
    
    if (actionConfig.href) {
      return (
        <Button asChild variant={variant} size={size === "sm" ? "sm" : "default"}>
          <Link to={actionConfig.href}>{actionConfig.label}</Link>
        </Button>
      );
    }
    
    return (
      <Button 
        onClick={actionConfig.onClick} 
        variant={variant}
        size={size === "sm" ? "sm" : "default"}
      >
        {actionConfig.label}
      </Button>
    );
  };

  return (
    <div className={cn("flex flex-col items-center justify-center text-center", sizes.container, className)}>
      <div className={cn(
        "rounded-full bg-muted flex items-center justify-center mb-4",
        sizes.iconContainer
      )}>
        <Icon className={cn("text-muted-foreground", sizes.icon)} />
      </div>
      
      <h3 className={cn("font-semibold mb-2", sizes.title)}>{title}</h3>
      
      <p className={cn("text-muted-foreground max-w-sm mb-6", sizes.description)}>
        {description}
      </p>
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && renderAction(action)}
          {secondaryAction && renderAction(secondaryAction, true)}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
