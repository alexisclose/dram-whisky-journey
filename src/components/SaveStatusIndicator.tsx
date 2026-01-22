import { Check } from "lucide-react";
import type { SaveStatus } from "@/hooks/useAutoSave";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

/**
 * A minimal status indicator for auto-save.
 * Shows "Saving..." while saving, "Saved ✔" when complete.
 */
const SaveStatusIndicator = ({ status }: SaveStatusIndicatorProps) => {
  if (status === "idle") return null;

  return (
    <div className="flex items-center justify-center gap-1.5 text-sm py-2">
      {status === "saving" && (
        <span className="text-muted-foreground animate-pulse">Saving...</span>
      )}
      {status === "saved" && (
        <span className="text-green-600 dark:text-green-500 flex items-center gap-1">
          Saved <Check className="h-4 w-4" />
        </span>
      )}
    </div>
  );
};

export default SaveStatusIndicator;
