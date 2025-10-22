-- migrations/seed_mock_users.sql
-- Safe to run repeatedly - uses ON CONFLICT for idempotent upserts
BEGIN;

-- Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if it doesn't exist (with comprehensive schema)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    preferred_language VARCHAR(5) DEFAULT 'fr',
    role VARCHAR(50) DEFAULT 'member',
    device_type VARCHAR(50) DEFAULT 'android',
    preferred_channel VARCHAR(50) DEFAULT 'app',
    avg_contribution_sats INTEGER DEFAULT 0,
    typical_payment_hour TIME DEFAULT '19:00',
    credit_score DECIMAL(3,2) DEFAULT 0.5 CHECK (credit_score >= 0 AND credit_score <= 1),
    trust_score DECIMAL(3,2) DEFAULT 0.5 CHECK (trust_score >= 0 AND trust_score <= 1),
    metadata JSONB DEFAULT '{}',
    avatar_url VARCHAR(500),
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_credit_score ON users(credit_score);

-- Insert mock users with comprehensive data
INSERT INTO users (
    id, name, phone_number, preferred_language, role, device_type, 
    preferred_channel, avg_contribution_sats, typical_payment_hour, 
    credit_score, trust_score, metadata, avatar_url, last_seen, 
    created_at, updated_at
) VALUES
-- Fatou Diop - Market Vendor & Group Captain
('11111111-1111-4111-8111-111111111111', 'Fatou Diop', '+221770000001', 'wo', 'group_captain', 'android', 'app', 10000, '19:00', 0.88, 0.94, 
 '{"notes":"Market vendor, organizes 10-person weekly tontine","groups":["g-market-01"],"location":"Dakar","occupation":"market_vendor","family_size":4}', 
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatou', '2024-01-15T19:30:00Z', NOW(), NOW()),

-- Mamadou Ndiaye - Traveling Trader
('22222222-2222-4222-8222-222222222222', 'Mamadou Ndiaye', '+221770000002', 'fr', 'member', 'feature_phone', 'ussd', 8000, '08:30', 0.62, 0.80,
 '{"notes":"Travelling trader, uses USSD via agent","groups":["g-neighborhood-01"],"location":"Thiès","occupation":"trader","travel_frequency":"high"}',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mamadou', '2024-01-14T08:45:00Z', NOW(), NOW()),

-- Aissatou Sarr - Diaspora (Paris)
('33333333-3333-4333-8333-333333333333', 'Aissatou Sarr', '+221770000003', 'fr', 'diaspora', 'iphone', 'app', 25000, '21:00', 0.97, 0.99,
 '{"notes":"Diaspora in Paris, sends remittances weekly","groups":["g-family-01"],"location":"Paris","occupation":"nurse","remittance_frequency":"weekly"}',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aissatou', '2024-01-15T21:15:00Z', NOW(), NOW()),

-- Seynabou Ba - Community Captain
('44444444-4444-4444-8444-444444444444', 'Seynabou Ba', '+221770000004', 'wo', 'organizer', 'android', 'app', 12000, '18:00', 0.90, 0.98,
 '{"notes":"Community captain, exports receipts frequently","groups":["g-market-01","g-women-02"],"location":"Dakar","occupation":"community_leader","groups_managed":2}',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Seynabou', '2024-01-15T18:30:00Z', NOW(), NOW()),

-- Ousmane Diouf - Agent/Cash-in Operator
('55555555-5555-4555-8555-555555555555', 'Ousmane Diouf', '+221770000005', 'fr', 'agent', 'android_tablet', 'agent_portal', 0, '09:00', 0.75, 0.80,
 '{"notes":"Agent for cash-in/out; offline queueing required","groups":[],"location":"Dakar","occupation":"agent","agent_type":"cash_in_out","commission_rate":0.02}',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ousmane', '2024-01-15T09:30:00Z', NOW(), NOW()),

-- Cheikh Kane - Smallholder Farmer
('66666666-6666-4666-8666-666666666666', 'Cheikh Kane', '+221770000006', 'wo', 'member', 'feature_phone', 'agent', 30000, '07:00', 0.58, 0.70,
 '{"notes":"Smallholder; contributes seasonally","groups":["g-farmers-01"],"location":"Kaolack","occupation":"farmer","crop_type":"peanuts","seasonal_pattern":"harvest"}',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cheikh', '2024-01-10T07:15:00Z', NOW(), NOW()),

-- Ndeye Fall - Student/Young Entrepreneur
('77777777-7777-4777-8777-777777777777', 'Ndeye Fall', '+221770000007', 'fr', 'member', 'android', 'app', 2000, '20:00', 0.67, 0.72,
 '{"notes":"Student; frequent small contributions","groups":["g-schoolmates-01"],"location":"Dakar","occupation":"student","university":"UCAD","payment_frequency":"weekly"}',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ndeye', '2024-01-15T20:30:00Z', NOW(), NOW()),

-- Baba Thiam - Elder/Risk-averse
('88888888-8888-4888-8888-888888888888', 'Baba Thiam', '+221770000008', 'wo', 'member', 'shared_feature_phone', 'agent', 15000, '10:00', 0.45, 0.60,
 '{"notes":"Elderly, uses shared device and local agent","groups":["g-elders-01"],"location":"Saint-Louis","occupation":"retired","age_group":"elderly","tech_literacy":"low"}',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Baba', '2024-01-12T10:30:00Z', NOW(), NOW()),

-- Amadou Ly - Youth Vendor/Developer Aspirant
('99999999-9999-4999-8999-999999999999', 'Amadou Ly', '+221770000009', 'fr', 'developer_ambassador', 'android', 'app', 15000, '22:00', 0.85, 0.88,
 '{"notes":"Youth vendor and local developer testing features","groups":["g-devs-01"],"location":"Dakar","occupation":"vendor","tech_savvy":true,"beta_tester":true}',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amadou', '2024-01-15T22:15:00Z', NOW(), NOW()),

-- Luc Low - Local Developer/Node Operator
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Luc Low', '+221770000010', 'fr', 'node_operator', 'laptop', 'admin_ui', 0, '12:00', 0.99, 0.99,
 '{"notes":"Developer and node operator","groups":[],"location":"Dakar","occupation":"developer","node_operator":true,"admin_access":true}',
 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luc', '2024-01-15T12:30:00Z', NOW(), NOW())

ON CONFLICT (phone_number) DO UPDATE SET
    name = EXCLUDED.name,
    preferred_language = EXCLUDED.preferred_language,
    role = EXCLUDED.role,
    device_type = EXCLUDED.device_type,
    preferred_channel = EXCLUDED.preferred_channel,
    avg_contribution_sats = EXCLUDED.avg_contribution_sats,
    typical_payment_hour = EXCLUDED.typical_payment_hour,
    credit_score = EXCLUDED.credit_score,
    trust_score = EXCLUDED.trust_score,
    metadata = EXCLUDED.metadata,
    avatar_url = EXCLUDED.avatar_url,
    last_seen = EXCLUDED.last_seen,
    updated_at = NOW();

-- Create groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS tontine_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    contribution_amount_sats INTEGER NOT NULL,
    cycle_days INTEGER DEFAULT 7,
    max_members INTEGER DEFAULT 10,
    current_cycle INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert mock groups
INSERT INTO tontine_groups (id, name, description, contribution_amount_sats, cycle_days, max_members, current_cycle, status, created_by) VALUES
('g-market-01', 'Marché Central Tontine', 'Weekly market vendor tontine for capital', 10000, 7, 10, 3, 'active', '11111111-1111-4111-8111-111111111111'),
('g-neighborhood-01', 'Quartier Liberté 6', 'Neighborhood savings group', 8000, 7, 8, 2, 'active', '22222222-2222-4222-8222-222222222222'),
('g-family-01', 'Famille Sarr', 'Family remittance group', 25000, 7, 5, 1, 'active', '33333333-3333-4333-8333-333333333333'),
('g-women-02', 'Femmes Entrepreneures', 'Women entrepreneurs group', 12000, 14, 6, 1, 'active', '44444444-4444-4444-8444-444444444444'),
('g-farmers-01', 'Agriculteurs Kaolack', 'Seasonal farmers group', 30000, 30, 12, 1, 'active', '66666666-6666-4666-8666-666666666666'),
('g-schoolmates-01', 'Anciens UCAD', 'University friends group', 2000, 7, 15, 4, 'active', '77777777-7777-4777-8777-777777777777'),
('g-elders-01', 'Anciens Saint-Louis', 'Elderly community group', 15000, 14, 8, 2, 'active', '88888888-8888-4888-8888-888888888888'),
('g-devs-01', 'Tech Senegal', 'Developer community group', 15000, 7, 20, 1, 'active', '99999999-9999-4999-8999-999999999999')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    contribution_amount_sats = EXCLUDED.contribution_amount_sats,
    cycle_days = EXCLUDED.cycle_days,
    max_members = EXCLUDED.max_members,
    current_cycle = EXCLUDED.current_cycle,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Create group_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES tontine_groups(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Insert group memberships
INSERT INTO group_members (group_id, user_id, role) VALUES
-- Market group members
('g-market-01', '11111111-1111-4111-8111-111111111111', 'admin'),
('g-market-01', '44444444-4444-4444-8444-444444444444', 'member'),
-- Neighborhood group members
('g-neighborhood-01', '22222222-2222-4222-8222-222222222222', 'member'),
-- Family group members
('g-family-01', '33333333-3333-4333-8333-333333333333', 'member'),
-- Women group members
('g-women-02', '44444444-4444-4444-8444-444444444444', 'admin'),
-- Farmers group members
('g-farmers-01', '66666666-6666-4666-8666-666666666666', 'member'),
-- Schoolmates group members
('g-schoolmates-01', '77777777-7777-4777-8777-777777777777', 'member'),
-- Elders group members
('g-elders-01', '88888888-8888-4888-8888-888888888888', 'member'),
-- Developers group members
('g-devs-01', '99999999-9999-4999-8999-999999999999', 'member')
ON CONFLICT (group_id, user_id) DO UPDATE SET
    role = EXCLUDED.role;

COMMIT;

-- Display summary
SELECT 
    'Users seeded: ' || COUNT(*) as summary
FROM users
WHERE phone_number LIKE '+22177000000%';

SELECT 
    'Groups seeded: ' || COUNT(*) as summary
FROM tontine_groups
WHERE id LIKE 'g-%';

SELECT 
    'Memberships seeded: ' || COUNT(*) as summary
FROM group_members;
