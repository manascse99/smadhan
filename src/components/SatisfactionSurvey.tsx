import { useState } from "react";
import { Star, MessageSquare, Send, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SatisfactionSurveyProps {
  complaintId: string;
  onSubmit: () => void;
}

export const SatisfactionSurvey = ({ complaintId, onSubmit }: SatisfactionSurveyProps) => {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          satisfaction_rating: rating 
        })
        .eq('id', complaintId);

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      onSubmit();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Rate Your Experience</h4>
          <p className="text-xs text-muted-foreground">Your feedback helps us improve</p>
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex items-center justify-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 transition-colors ${
                star <= (hoveredRating || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Quick satisfaction buttons */}
      <div className="flex gap-2 justify-center mb-4">
        <Button
          type="button"
          variant={rating >= 4 ? "default" : "outline"}
          size="sm"
          onClick={() => setRating(5)}
          className="gap-2"
        >
          <ThumbsUp className="w-4 h-4" />
          Satisfied
        </Button>
        <Button
          type="button"
          variant={rating > 0 && rating < 3 ? "destructive" : "outline"}
          size="sm"
          onClick={() => setRating(2)}
          className="gap-2"
        >
          <ThumbsDown className="w-4 h-4" />
          Not Satisfied
        </Button>
      </div>

      {/* Feedback textarea */}
      <Textarea
        placeholder="Share your suggestions to help us improve... (Optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="mb-3 text-sm resize-none"
        rows={2}
      />

      <Button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        className="w-full bg-gradient-to-r from-primary to-secondary"
        size="sm"
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
    </Card>
  );
};
