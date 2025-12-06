-- Create table to store OTP codes
CREATE TABLE public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check OTP (needed for verification before user exists)
CREATE POLICY "Anyone can verify OTP codes"
ON public.otp_codes
FOR SELECT
USING (true);

-- Allow edge function to insert OTP codes (using service role)
CREATE POLICY "Service role can insert OTP codes"
ON public.otp_codes
FOR INSERT
WITH CHECK (true);

-- Allow edge function to update OTP codes
CREATE POLICY "Service role can update OTP codes"
ON public.otp_codes
FOR UPDATE
USING (true);

-- Allow edge function to delete expired OTPs
CREATE POLICY "Service role can delete OTP codes"
ON public.otp_codes
FOR DELETE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);