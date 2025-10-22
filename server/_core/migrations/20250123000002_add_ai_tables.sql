-- migrations/20250123000002_add_ai_tables.sql
-- Add AI-related tables and columns to support credit scoring and fraud detection

-- Add credit_score column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS credit_score NUMERIC(4,3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credit_score_updated_at TIMESTAMPTZ DEFAULT NULL;

-- Create ai_alerts table for storing AI-generated alerts
CREATE TABLE IF NOT EXISTS ai_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'fraud_suspect','credit_offer','liquidity_short'
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ
);

-- Create ai_metrics table for storing AI model metrics and features
CREATE TABLE IF NOT EXISTS ai_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_alerts_user ON ai_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_type ON ai_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_resolved ON ai_alerts (resolved);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_user ON ai_metrics (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_key ON ai_metrics (metric_key);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_created ON ai_metrics (created_at);

-- Add comment for documentation
COMMENT ON TABLE ai_alerts IS 'Stores AI-generated alerts for fraud detection, credit offers, and other automated insights';
COMMENT ON TABLE ai_metrics IS 'Stores AI model metrics, feature values, and model outputs for audit and analysis';
COMMENT ON COLUMN users.credit_score IS 'AI-generated credit score (0-1) based on tontine behavior and community reputation';
COMMENT ON COLUMN users.credit_score_updated_at IS 'Timestamp when credit score was last updated by AI service';
