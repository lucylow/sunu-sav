-- migrations/20250122_add_ai_tables.sql
-- Add AI-related columns to existing users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS credit_score NUMERIC(4,3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS credit_score_updated_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"sms_enabled": true, "email_enabled": false, "push_enabled": true, "reminder_frequency": "daily", "preferred_language": "wo"}'::jsonb,
  ADD COLUMN IF NOT EXISTS risk_profile JSONB DEFAULT NULL;

-- Create AI alerts table for fraud detection and other AI-generated alerts
CREATE TABLE IF NOT EXISTS ai_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('fraud_suspect', 'credit_offer', 'liquidity_short', 'payment_risk', 'anomaly_detected')),
  payload JSONB,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_reason TEXT
);

-- Create AI metrics table for storing various AI-generated metrics
CREATE TABLE IF NOT EXISTS ai_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC,
  metric_type TEXT DEFAULT 'score' CHECK (metric_type IN ('score', 'count', 'rate', 'amount', 'duration')),
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days')
);

-- Create AI model performance tracking table
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT NOT NULL,
  model_version TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  sample_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create AI training data table for storing anonymized training examples
CREATE TABLE IF NOT EXISTS ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL CHECK (data_type IN ('transaction', 'contribution', 'user_behavior')),
  features JSONB NOT NULL,
  label JSONB,
  anonymized BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  used_for_training BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_alerts_user ON ai_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_type ON ai_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_status ON ai_alerts (status);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_created ON ai_alerts (created_at);

CREATE INDEX IF NOT EXISTS idx_ai_metrics_user ON ai_metrics (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_key ON ai_metrics (metric_key);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_created ON ai_metrics (created_at);

CREATE INDEX IF NOT EXISTS idx_ai_model_perf_model ON ai_model_performance (model_name);
CREATE INDEX IF NOT EXISTS idx_ai_model_perf_created ON ai_model_performance (created_at);

CREATE INDEX IF NOT EXISTS idx_ai_training_data_type ON ai_training_data (data_type);
CREATE INDEX IF NOT EXISTS idx_ai_training_data_used ON ai_training_data (used_for_training);

-- Add comments for documentation
COMMENT ON TABLE ai_alerts IS 'Stores AI-generated alerts for fraud detection, credit offers, and other automated notifications';
COMMENT ON TABLE ai_metrics IS 'Stores various AI-generated metrics and scores for users';
COMMENT ON TABLE ai_model_performance IS 'Tracks performance metrics of AI models over time';
COMMENT ON TABLE ai_training_data IS 'Stores anonymized training data for AI model improvement';

COMMENT ON COLUMN users.credit_score IS 'AI-generated credit score between 0 and 1';
COMMENT ON COLUMN users.credit_score_updated_at IS 'Timestamp when credit score was last updated';
COMMENT ON COLUMN users.notification_preferences IS 'User preferences for AI-powered notifications';
COMMENT ON COLUMN users.risk_profile IS 'AI-generated risk assessment profile';
