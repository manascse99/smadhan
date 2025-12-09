-- Modify complaint_updates to support multiple proof URLs
ALTER TABLE public.complaint_updates 
ADD COLUMN proof_urls text[] DEFAULT NULL;

-- Add a comment to clarify usage
COMMENT ON COLUMN public.complaint_updates.proof_urls IS 'Array of URLs for resolution proof images/videos';