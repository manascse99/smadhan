import { CheckCircle, AlertTriangle, XCircle, Loader2, Sparkles, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ValidationResult {
  match: boolean;
  confidence: number;
  detected: string;
  suggestedCategory: string;
  suggestedDescription: string;
  imageQuality: string;
}

interface ImageValidationBadgeProps {
  result: ValidationResult | null;
  isValidating: boolean;
  onApplySuggestion?: (description: string) => void;
  onApplyCategory?: (category: string) => void;
  currentCategory?: string;
}

const ImageValidationBadge = ({
  result,
  isValidating,
  onApplySuggestion,
  onApplyCategory,
  currentCategory,
}: ImageValidationBadgeProps) => {
  if (isValidating) {
    return (
      <div className="absolute inset-0 bg-background/70 rounded-lg flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) return null;

  const getStatus = () => {
    if (result.imageQuality === "blurry" || result.imageQuality === "dark" || result.imageQuality === "unclear") {
      return { icon: ImageOff, color: "text-yellow-500", bg: "bg-yellow-500/20", label: "Low Quality" };
    }
    if (result.match && result.confidence >= 0.7) {
      return { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/20", label: "Verified" };
    }
    if (result.confidence >= 0.4) {
      return { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/20", label: "Uncertain" };
    }
    return { icon: XCircle, color: "text-destructive", bg: "bg-destructive/20", label: "Mismatch" };
  };

  const status = getStatus();
  const StatusIcon = status.icon;
  const showCategorySuggestion =
    currentCategory && result.suggestedCategory !== currentCategory && result.confidence >= 0.5;

  return (
    <>
      {/* Badge overlay on image */}
      <div className={cn("absolute top-1 left-1 rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[10px] font-medium", status.bg, status.color)}>
        <StatusIcon className="w-3 h-3" />
        {status.label}
      </div>

      {/* Details below image */}
      <div className="mt-1 space-y-1">
        <p className="text-[10px] text-muted-foreground truncate" title={result.detected}>
          {result.detected}
        </p>

        {showCategorySuggestion && onApplyCategory && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-5 text-[10px] px-1.5 w-full"
            onClick={() => onApplyCategory(result.suggestedCategory)}
          >
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            Suggest: {result.suggestedCategory}
          </Button>
        )}

        {result.suggestedDescription && onApplySuggestion && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] px-1.5 w-full text-primary"
            onClick={() => onApplySuggestion(result.suggestedDescription)}
          >
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            Use AI description
          </Button>
        )}
      </div>
    </>
  );
};

export default ImageValidationBadge;
