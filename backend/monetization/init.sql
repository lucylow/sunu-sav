-- backend/monetization/init.sql
-- Initialize SunuSàv Monetization Database

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS sunusav_monetization CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE sunusav_monetization;

-- Create groups table (if not exists from main app)
CREATE TABLE IF NOT EXISTS groups (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    country VARCHAR(8) DEFAULT 'SN',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create tontine_cycles table
CREATE TABLE IF NOT EXISTS tontine_cycles (
    id VARCHAR(64) PRIMARY KEY,
    group_id VARCHAR(64) NOT NULL,
    contribution_sats BIGINT NOT NULL,
    payout_total_sats BIGINT NOT NULL,
    cycle_index INT DEFAULT 0,
    status ENUM('collecting', 'ready', 'paid', 'failed') DEFAULT 'collecting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_payout_at TIMESTAMP NULL,
    withdraw_invoice TEXT,
    winner_user_id VARCHAR(64),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(64) PRIMARY KEY,
    cycle_id VARCHAR(64) NOT NULL,
    member_pubkey VARCHAR(255) NOT NULL,
    sats_amount BIGINT NOT NULL,
    lnd_invoice TEXT,
    preimage VARCHAR(255),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES tontine_cycles(id) ON DELETE CASCADE
);

-- Create fee_records table
CREATE TABLE IF NOT EXISTS fee_records (
    id VARCHAR(64) PRIMARY KEY,
    cycle_id VARCHAR(64),
    sats_fee BIGINT NOT NULL,
    sats_to_partner BIGINT DEFAULT 0,
    sats_to_community BIGINT DEFAULT 0,
    sats_to_platform BIGINT DEFAULT 0,
    reason VARCHAR(255),
    btc_xof_rate_at_record DECIMAL(18,2),
    opreturn_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cycle_id) REFERENCES tontine_cycles(id) ON DELETE SET NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    tier ENUM('standard', 'pro', 'enterprise') DEFAULT 'standard',
    recurring_xof INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    payment_method VARCHAR(50) DEFAULT 'lightning',
    last_payment_at TIMESTAMP NULL
);

-- Create partner_settlements table
CREATE TABLE IF NOT EXISTS partner_settlements (
    id VARCHAR(64) PRIMARY KEY,
    partner VARCHAR(50) NOT NULL,
    xof_amount DECIMAL(18,2) NOT NULL,
    sats_equivalent BIGINT,
    settled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settlement_reference VARCHAR(255),
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending'
);

-- Create revenue_reports table
CREATE TABLE IF NOT EXISTS revenue_reports (
    id VARCHAR(64) PRIMARY KEY,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    total_platform_revenue_sats BIGINT DEFAULT 0,
    total_community_fund_sats BIGINT DEFAULT 0,
    total_partner_payouts_sats BIGINT DEFAULT 0,
    total_platform_revenue_xof DECIMAL(18,2) DEFAULT 0,
    total_community_fund_xof DECIMAL(18,2) DEFAULT 0,
    total_partner_payouts_xof DECIMAL(18,2) DEFAULT 0,
    cycles_processed INT DEFAULT 0,
    groups_active INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create community_fund table
CREATE TABLE IF NOT EXISTS community_fund (
    id VARCHAR(64) PRIMARY KEY,
    total_sats BIGINT DEFAULT 0,
    total_xof DECIMAL(18,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    description TEXT
);

-- Create fund_distributions table
CREATE TABLE IF NOT EXISTS fund_distributions (
    id VARCHAR(64) PRIMARY KEY,
    fund_id VARCHAR(64) NOT NULL,
    recipient_type ENUM('group', 'user', 'charity', 'development') NOT NULL,
    recipient_id VARCHAR(64) NOT NULL,
    sats_amount BIGINT NOT NULL,
    xof_amount DECIMAL(18,2) NOT NULL,
    purpose TEXT,
    status ENUM('pending', 'approved', 'distributed', 'rejected') DEFAULT 'pending',
    approved_by VARCHAR(64),
    distributed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fund_id) REFERENCES community_fund(id) ON DELETE CASCADE
);

-- Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id VARCHAR(64) PRIMARY KEY,
    btc_xof_rate DECIMAL(18,2) NOT NULL,
    source VARCHAR(50) DEFAULT 'manual',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create payout_logs table
CREATE TABLE IF NOT EXISTS payout_logs (
    id VARCHAR(64) PRIMARY KEY,
    cycle_id VARCHAR(64) NOT NULL,
    lightning_payment_hash VARCHAR(255),
    lightning_preimage VARCHAR(255),
    payout_method ENUM('lightning', 'mobile_money', 'bank') DEFAULT 'lightning',
    status ENUM('initiated', 'processing', 'completed', 'failed') DEFAULT 'initiated',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (cycle_id) REFERENCES tontine_cycles(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_records_cycle_id ON fee_records(cycle_id);
CREATE INDEX IF NOT EXISTS idx_fee_records_created_at ON fee_records(created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_partner_settlements_partner ON partner_settlements(partner);
CREATE INDEX IF NOT EXISTS idx_partner_settlements_status ON partner_settlements(status);
CREATE INDEX IF NOT EXISTS idx_tontine_cycles_status ON tontine_cycles(status);
CREATE INDEX IF NOT EXISTS idx_tontine_cycles_group_id ON tontine_cycles(group_id);
CREATE INDEX IF NOT EXISTS idx_transactions_cycle_id ON transactions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_timestamp ON exchange_rates(timestamp);
CREATE INDEX IF NOT EXISTS idx_payout_logs_cycle_id ON payout_logs(cycle_id);

-- Insert initial community fund
INSERT IGNORE INTO community_fund (id, total_sats, total_xof, description) 
VALUES ('initial-fund', 0, 0.00, 'SunuSàv Community Fund');

-- Insert initial exchange rate
INSERT IGNORE INTO exchange_rates (id, btc_xof_rate, source, is_active)
VALUES ('initial-rate', 8000000.00, 'manual', TRUE);

-- Create a sample group for testing
INSERT IGNORE INTO groups (id, name, description, country, is_verified)
VALUES ('sample-group-1', 'Test Tontine Group', 'A sample group for testing monetization features', 'SN', TRUE);

-- Create a sample tontine cycle
INSERT IGNORE INTO tontine_cycles (id, group_id, contribution_sats, payout_total_sats, cycle_index, status)
VALUES ('sample-cycle-1', 'sample-group-1', 10000, 100000, 1, 'collecting');

-- Create a sample subscription
INSERT IGNORE INTO subscriptions (id, user_id, tier, recurring_xof, active, expires_at)
VALUES ('sample-sub-1', 'sample-user-1', 'pro', 500, TRUE, DATE_ADD(NOW(), INTERVAL 30 DAY));
