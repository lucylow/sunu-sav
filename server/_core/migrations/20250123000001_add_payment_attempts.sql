-- Add payment_attempts table for idempotent payout processing
-- Migration: Add payment attempts tracking with advisory locks

CREATE TABLE IF NOT EXISTS payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT,        -- client provided or derived uniqueness token
  group_id UUID NOT NULL REFERENCES tontine_groups(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  invoice TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending | success | failed
  preimage TEXT NULL,
  fee_sat INTEGER NULL,
  lnd_attempts INTEGER DEFAULT 0,
  error_message TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- unique idempotency per group+cycle to prevent duplicate attempts
CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_attempts_idempotency 
ON payment_attempts (idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_payment_attempts_group_cycle 
ON payment_attempts (group_id, cycle_number);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_status 
ON payment_attempts (status);

-- Add cycle_status to tontine_groups for better state tracking
ALTER TABLE tontine_groups 
ADD COLUMN IF NOT EXISTS cycle_status TEXT DEFAULT 'active' 
CHECK (cycle_status IN ('active', 'processing', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_tontine_groups_cycle_status 
ON tontine_groups (cycle_status);
