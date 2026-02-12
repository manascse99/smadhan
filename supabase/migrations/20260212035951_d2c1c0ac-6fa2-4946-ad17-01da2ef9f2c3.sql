
-- Create satisfaction_surveys table
CREATE TABLE public.satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  overall_rating integer NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  speed_rating integer NOT NULL CHECK (speed_rating BETWEEN 1 AND 5),
  staff_rating integer NOT NULL CHECK (staff_rating BETWEEN 1 AND 5),
  resolution_quality text NOT NULL CHECK (resolution_quality IN ('yes', 'partially', 'no')),
  would_recommend text NOT NULL CHECK (would_recommend IN ('yes', 'maybe', 'no')),
  feedback text,
  suggestions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(complaint_id)
);

-- Enable RLS
ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

-- Users can insert their own surveys
CREATE POLICY "Users can insert own surveys"
ON public.satisfaction_surveys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own surveys
CREATE POLICY "Users can view own surveys"
ON public.satisfaction_surveys
FOR SELECT
USING (auth.uid() = user_id);

-- Admins and officers can view all surveys
CREATE POLICY "Admins can view all surveys"
ON public.satisfaction_surveys
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'officer'));
