-- Drop the insecure public SELECT policy on otp_codes
DROP POLICY IF EXISTS "Anyone can verify OTP codes" ON public.otp_codes;

-- Ensure only service role can access OTP codes (edge functions use service role)
-- The existing policies for INSERT/UPDATE/DELETE should remain for service role operations