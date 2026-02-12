import { useState, useEffect } from "react";
import { Star, Zap, Users, CheckCircle, ThumbsUp, MessageSquare, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SurveyData {
  overall_rating: number;
  speed_rating: number;
  staff_rating: number;
  resolution_quality: string;
  would_recommend: string;
  feedback: string | null;
  suggestions: string | null;
  created_at: string;
}

const speedLabels: Record<number, string> = { 1: "Very Slow", 2: "Slow", 3: "Average", 4: "Fast", 5: "Very Fast" };
const staffLabels: Record<number, string> = { 1: "Very Poor", 2: "Poor", 3: "Average", 4: "Good", 5: "Excellent" };

export const SurveyResultsCard = ({ complaintId }: { complaintId: string }) => {
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurvey = async () => {
      const { data, error } = await supabase
        .from('satisfaction_surveys' as any)
        .select('*')
        .eq('complaint_id', complaintId)
        .maybeSingle();

      if (!error && data) {
        setSurvey(data as any);
      }
      setLoading(false);
    };
    fetchSurvey();
  }, [complaintId]);

  if (loading) return null;
  if (!survey) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Citizen Feedback
        </h2>
        <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
      </Card>
    );
  }

  const Stars = ({ count }: { count: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-4 h-4 ${s <= count ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary" />
        Citizen Feedback
      </h2>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-xs flex items-center gap-1">
            <Star className="w-3 h-3" /> Overall Satisfaction
          </Label>
          <Stars count={survey.overall_rating} />
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-xs flex items-center gap-1">
            <Zap className="w-3 h-3" /> Resolution Speed
          </Label>
          <Badge variant="secondary">{speedLabels[survey.speed_rating]}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-xs flex items-center gap-1">
            <Users className="w-3 h-3" /> Staff Behavior
          </Label>
          <Badge variant="secondary">{staffLabels[survey.staff_rating]}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-xs flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Problem Fixed?
          </Label>
          <Badge variant={survey.resolution_quality === 'yes' ? 'default' : survey.resolution_quality === 'partially' ? 'secondary' : 'destructive'}>
            {survey.resolution_quality === 'yes' ? 'Yes' : survey.resolution_quality === 'partially' ? 'Partially' : 'No'}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-muted-foreground text-xs flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> Would Recommend?
          </Label>
          <Badge variant="secondary" className="capitalize">{survey.would_recommend}</Badge>
        </div>

        {survey.feedback && (
          <div>
            <Label className="text-muted-foreground text-xs flex items-center gap-1 mb-1">
              <MessageSquare className="w-3 h-3" /> Feedback
            </Label>
            <p className="text-sm bg-muted/50 p-3 rounded-md">{survey.feedback}</p>
          </div>
        )}

        {survey.suggestions && (
          <div>
            <Label className="text-muted-foreground text-xs flex items-center gap-1 mb-1">
              <Lightbulb className="w-3 h-3" /> Suggestions
            </Label>
            <p className="text-sm bg-muted/50 p-3 rounded-md">{survey.suggestions}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Submitted on {new Date(survey.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </Card>
  );
};
