-- Supabase-compatible database schema for SunuSàv
-- This extends the existing schema with Senegal-specific features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Monetization tables for fee tracking and subscriptions
CREATE TABLE IF NOT EXISTS fee_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES tontine_groups(id),
  sats_fee BIGINT NOT NULL,
  sats_to_partner BIGINT DEFAULT 0,
  sats_to_community BIGINT DEFAULT 0,
  sats_to_platform BIGINT DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  tier VARCHAR(50) DEFAULT 'standard',
  recurring_xof INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner VARCHAR(50) NOT NULL,
  xof_amount DECIMAL(18, 2) NOT NULL,
  sats_equivalent BIGINT,
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Senegal-specific tables
CREATE TABLE IF NOT EXISTS senegal_holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wave_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  amount_xof DECIMAL(18, 2) NOT NULL,
  amount_sats BIGINT NOT NULL,
  wave_transaction_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS ussd_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number VARCHAR(20) NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  menu_state VARCHAR(50) DEFAULT 'main',
  user_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency_pair VARCHAR(10) NOT NULL, -- 'BTC_XOF'
  rate DECIMAL(18, 8) NOT NULL,
  source VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Community fund table
CREATE TABLE IF NOT EXISTS community_fund (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_sats BIGINT DEFAULT 0,
  total_xof DECIMAL(18, 2) DEFAULT 0,
  last_distribution TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fund distributions table
CREATE TABLE IF NOT EXISTS fund_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_id UUID REFERENCES community_fund(id),
  recipient_id UUID REFERENCES profiles(id),
  amount_sats BIGINT NOT NULL,
  amount_xof DECIMAL(18, 2) NOT NULL,
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  distributed_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced tontine_groups table with Senegal-specific fields
ALTER TABLE tontine_groups ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'SN';
ALTER TABLE tontine_groups ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE tontine_groups ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'fr';
ALTER TABLE tontine_groups ADD COLUMN IF NOT EXISTS wave_enabled BOOLEAN DEFAULT true;
ALTER TABLE tontine_groups ADD COLUMN IF NOT EXISTS ussd_enabled BOOLEAN DEFAULT true;

-- Enhanced profiles table with Senegal-specific fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'fr';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'SN';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wave_enabled BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ussd_enabled BOOLEAN DEFAULT true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fee_records_cycle_id ON fee_records(cycle_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_created_at ON fee_records(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_wave_transactions_user_id ON wave_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wave_transactions_status ON wave_transactions(status);
CREATE INDEX IF NOT EXISTS idx_ussd_sessions_phone ON ussd_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_ussd_sessions_expires ON ussd_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currency ON exchange_rates(currency_pair);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_timestamp ON exchange_rates(timestamp);

-- Insert Senegal holidays
INSERT INTO senegal_holidays (date, name, is_recurring) VALUES
('2025-04-07', 'Korité', true),
('2025-06-04', 'Tabaski', true),
('2025-08-19', 'Tamkharit', true),
('2025-04-04', 'Independence Day', true),
('2025-01-01', 'New Year', true),
('2025-05-01', 'Labour Day', true),
('2025-12-25', 'Christmas', true)
ON CONFLICT DO NOTHING;

-- Initialize community fund
INSERT INTO community_fund (id, total_sats, total_xof) 
VALUES (uuid_generate_v4(), 0, 0)
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wave_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ussd_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for fee_records (admin only)
CREATE POLICY "Admin can view all fee records" ON fee_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policies for subscriptions (user can view their own)
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- Policies for wave_transactions (user can view their own)
CREATE POLICY "Users can view own wave transactions" ON wave_transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wave transactions" ON wave_transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies for ussd_sessions (public read, restricted write)
CREATE POLICY "Public can read ussd sessions" ON ussd_sessions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert ussd sessions" ON ussd_sessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Functions for Senegal-specific business logic
CREATE OR REPLACE FUNCTION is_business_day_in_senegal(check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if it's a weekend
  IF EXTRACT(DOW FROM check_date) IN (0, 6) THEN
    RETURN FALSE;
  END IF;
  
  -- Check if it's a holiday
  IF EXISTS (
    SELECT 1 FROM senegal_holidays 
    WHERE date = check_date 
    OR (is_recurring = true AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM check_date) 
        AND EXTRACT(DAY FROM date) = EXTRACT(DAY FROM check_date))
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get next business day
CREATE OR REPLACE FUNCTION get_next_business_day_in_senegal(start_date DATE)
RETURNS DATE AS $$
DECLARE
  next_date DATE := start_date + INTERVAL '1 day';
BEGIN
  WHILE NOT is_business_day_in_senegal(next_date) LOOP
    next_date := next_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate fee breakdown
CREATE OR REPLACE FUNCTION calculate_fee_breakdown(
  payout_sats BIGINT,
  group_verified BOOLEAN DEFAULT FALSE,
  user_recurring BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  sats_fee BIGINT,
  platform_share BIGINT,
  community_share BIGINT,
  partner_reserved BIGINT
) AS $$
DECLARE
  base_fee_percent DECIMAL := 0.01; -- 1%
  verified_discount DECIMAL := 0.50; -- 50% discount
  recurring_discount DECIMAL := 0.75; -- 25% discount
  community_share_percent DECIMAL := 0.20; -- 20%
  partner_share_percent DECIMAL := 0.30; -- 30%
  
  final_fee_percent DECIMAL;
  calculated_fee BIGINT;
BEGIN
  -- Calculate final fee percentage
  final_fee_percent := base_fee_percent;
  
  IF group_verified THEN
    final_fee_percent := final_fee_percent * verified_discount;
  END IF;
  
  IF user_recurring THEN
    final_fee_percent := final_fee_percent * recurring_discount;
  END IF;
  
  -- Calculate fee amounts
  calculated_fee := FLOOR(payout_sats * final_fee_percent);
  
  -- Ensure minimum fee of 1 sat
  IF calculated_fee < 1 THEN
    calculated_fee := 1;
  END IF;
  
  -- Calculate splits
  sats_fee := calculated_fee;
  platform_share := FLOOR(calculated_fee * (1.0 - community_share_percent - partner_share_percent));
  community_share := FLOOR(calculated_fee * community_share_percent);
  partner_reserved := calculated_fee - platform_share - community_share;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update community fund when fees are recorded
CREATE OR REPLACE FUNCTION update_community_fund()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_fund 
  SET 
    total_sats = total_sats + NEW.sats_to_community,
    total_xof = total_xof + (NEW.sats_to_community * 0.00000001 * 8000000), -- Convert sats to XOF (approximate)
    updated_at = now()
  WHERE id = (SELECT id FROM community_fund LIMIT 1);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_community_fund
  AFTER INSERT ON fee_records
  FOR EACH ROW
  EXECUTE FUNCTION update_community_fund();

-- Create views for common queries
CREATE OR REPLACE VIEW group_fee_summary AS
SELECT 
  tg.id as group_id,
  tg.name as group_name,
  tg.is_verified,
  COUNT(fr.id) as total_fee_records,
  SUM(fr.sats_fee) as total_fees_sats,
  SUM(fr.sats_to_platform) as total_platform_sats,
  SUM(fr.sats_to_community) as total_community_sats,
  SUM(fr.sats_to_partner) as total_partner_sats
FROM tontine_groups tg
LEFT JOIN fee_records fr ON tg.id = fr.cycle_id
GROUP BY tg.id, tg.name, tg.is_verified;

CREATE OR REPLACE VIEW user_subscription_summary AS
SELECT 
  p.id as user_id,
  p.name as user_name,
  p.email,
  s.tier,
  s.active,
  s.recurring_xof,
  s.expires_at
FROM profiles p
LEFT JOIN subscriptions s ON p.id = s.user_id AND s.active = true;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
