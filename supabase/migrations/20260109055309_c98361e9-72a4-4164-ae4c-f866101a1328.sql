-- Create reviews table for website feedback
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (is_approved = true);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update reviews (approve/reject)
CREATE POLICY "Admins can update reviews"
ON public.reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));