-- Add priority and SLA deadline columns to complaints table
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS priority text CHECK (priority IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS sla_deadline timestamp with time zone;