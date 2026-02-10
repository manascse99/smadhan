import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ValidationResult } from "@/components/ImageValidationBadge";

export function useImageValidation() {
  const [validationResults, setValidationResults] = useState<Record<number, ValidationResult | null>>({});
  const [validatingIndexes, setValidatingIndexes] = useState<Set<number>>(new Set());

  const validateImage = useCallback(async (file: File, index: number, category: string) => {
    setValidatingIndexes((prev) => new Set(prev).add(index));

    try {
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke("validate-complaint-image", {
        body: { imageBase64: base64, category },
      });

      if (error) throw error;

      setValidationResults((prev) => ({ ...prev, [index]: data as ValidationResult }));

      // Show toast based on result
      if (data.imageQuality === "blurry" || data.imageQuality === "dark" || data.imageQuality === "unclear") {
        toast.warning(`Image ${index + 1}: Quality is ${data.imageQuality}. Consider uploading a clearer photo.`);
      } else if (data.match && data.confidence >= 0.7) {
        toast.success(`Image ${index + 1} verified: ${data.detected}`);
      } else if (!data.match && data.confidence >= 0.5) {
        toast.warning(`Image ${index + 1} may not match "${category}". Detected: ${data.detected}`);
      }
    } catch (err: any) {
      console.error("Validation error:", err);
      // Don't block user - just skip validation
      setValidationResults((prev) => ({ ...prev, [index]: null }));
    } finally {
      setValidatingIndexes((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, []);

  const removeValidation = useCallback((index: number) => {
    setValidationResults((prev) => {
      const next = { ...prev };
      delete next[index];
      // Re-index results after removal
      const reindexed: Record<number, ValidationResult | null> = {};
      const keys = Object.keys(next).map(Number).sort((a, b) => a - b);
      keys.forEach((key) => {
        const newKey = key > index ? key - 1 : key;
        reindexed[newKey] = next[key];
      });
      return reindexed;
    });
  }, []);

  const hasBlockingMismatch = useCallback(() => {
    return Object.values(validationResults).some(
      (r) => r && !r.match && r.confidence >= 0.8
    );
  }, [validationResults]);

  return {
    validationResults,
    validatingIndexes,
    validateImage,
    removeValidation,
    hasBlockingMismatch,
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
