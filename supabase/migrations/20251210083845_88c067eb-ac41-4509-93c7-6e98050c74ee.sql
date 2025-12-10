-- Add new complaint status values
ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS 'escalated';
ALTER TYPE complaint_status ADD VALUE IF NOT EXISTS 'fund_required';
