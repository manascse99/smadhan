import { useState } from "react";
import { Star, Send, Zap, Users, CheckCircle, ThumbsUp, Lightbulb, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SatisfactionSurveyProps {
  complaintId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}

const speedLabels = ["", "Very Slow", "Slow", "Average", "Fast", "Very Fast"];
const staffLabels = ["", "Very Poor", "Poor", "Average", "Good", "Excellent"];

export const SatisfactionSurvey = ({ complaintId, open, onOpenChange, onSubmit }: SatisfactionSurveyProps) => {
  const { user } = useAuth();
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [speedRating, setSpeedRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const [resolutionQuality, setResolutionQuality] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState("");
  const [feedback, setFeedback] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (overallRating === 0) { toast.error("Please select overall rating"); return; }
    if (speedRating === 0) { toast.error("Please rate resolution speed"); return; }
    if (staffRating === 0) { toast.error("Please rate staff behavior"); return; }
    if (!resolutionQuality) { toast.error("Please select resolution quality"); return; }
    if (!wouldRecommend) { toast.error("Please select recommendation choice"); return; }
    if (!user) { toast.error("Please login first"); return; }

    setIsSubmitting(true);
    try {
      // Insert survey into satisfaction_surveys table
      const { error: surveyError } = await supabase
        .from('satisfaction_surveys' as any)
        .insert({
          complaint_id: complaintId,
          user_id: user.id,
          overall_rating: overallRating,
          speed_rating: speedRating,
          staff_rating: staffRating,
          resolution_quality: resolutionQuality,
          would_recommend: wouldRecommend,
          feedback: feedback || null,
          suggestions: suggestions || null,
        } as any);

      if (surveyError) throw surveyError;

      // Also update satisfaction_rating on complaints table
      const { error: complaintError } = await supabase
        .from('complaints')
        .update({ satisfaction_rating: overallRating })
        .eq('id', complaintId);

      if (complaintError) throw complaintError;

      toast.success("Thank you for your detailed feedback!");
      onSubmit();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ScaleRating = ({ 
    value, onChange, labels, icon: Icon, title 
  }: { 
    value: number; onChange: (v: number) => void; labels: string[]; icon: any; title: string 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {title} <span className="text-destructive">*</span>
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2 px-1 rounded-md text-xs font-medium border transition-all ${
              value === n
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {labels[n]}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Rate Your Experience
          </DialogTitle>
          <DialogDescription>
            Your feedback helps us improve our services. Please fill in all required fields.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Overall Satisfaction - Stars */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Overall Satisfaction <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center justify-center gap-2 py-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOverallRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || overallRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {overallRating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {["", "Very Poor", "Poor", "Average", "Good", "Excellent"][overallRating]}
              </p>
            )}
          </div>

          {/* Resolution Speed */}
          <ScaleRating
            value={speedRating}
            onChange={setSpeedRating}
            labels={speedLabels}
            icon={Zap}
            title="Resolution Speed"
          />

          {/* Staff Behavior */}
          <ScaleRating
            value={staffRating}
            onChange={setStaffRating}
            labels={staffLabels}
            icon={Users}
            title="Staff Behavior"
          />

          {/* Resolution Quality */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary" />
              Was the problem actually fixed? <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={resolutionQuality} onValueChange={setResolutionQuality} className="flex gap-4">
              {[
                { value: "yes", label: "Yes, fully fixed" },
                { value: "partially", label: "Partially fixed" },
                { value: "no", label: "Not fixed" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`quality-${opt.value}`} />
                  <Label htmlFor={`quality-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Would Recommend */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-primary" />
              Would you recommend this platform? <span className="text-destructive">*</span>
            </Label>
            <RadioGroup value={wouldRecommend} onValueChange={setWouldRecommend} className="flex gap-4">
              {[
                { value: "yes", label: "Yes" },
                { value: "maybe", label: "Maybe" },
                { value: "no", label: "No" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`recommend-${opt.value}`} />
                  <Label htmlFor={`recommend-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Detailed Feedback */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Detailed Feedback <span className="text-xs text-muted-foreground">(optional, max 500 chars)</span>
            </Label>
            <Textarea
              placeholder="Share your experience in detail..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{feedback.length}/500</p>
          </div>

          {/* Improvement Suggestions */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Improvement Suggestions <span className="text-xs text-muted-foreground">(optional, max 300 chars)</span>
            </Label>
            <Textarea
              placeholder="What could be improved?"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value.slice(0, 300))}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{suggestions.length}/300</p>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
