-- migrations/0001_roles.sql
-- SunuSàv RBAC (Role-Based Access Control) Schema
-- Implements least-privilege access control for Bitcoin tontine operations

-- Users table with privacy-focused design
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_hash TEXT UNIQUE NOT NULL, -- HMAC(phone, server_secret) for privacy
  nostr_pubkey TEXT, -- Optional Nostr integration for decentralized identity
  preferred_language VARCHAR(8) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Security fields
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  mfa_enabled BOOLEAN DEFAULT false,
  mfa_secret TEXT, -- Encrypted MFA secret
  
  -- Audit fields
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Roles table for different permission levels
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'member', 'group_admin', 'sys_admin', 'auditor'
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- System roles cannot be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Permissions table for granular access control
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'create_invoice', 'close_channel', 'manage_group', 'view_audit_logs'
  description TEXT,
  resource_type TEXT, -- 'group', 'channel', 'user', 'system'
  action TEXT, -- 'create', 'read', 'update', 'delete', 'execute'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

-- Role-Permission mapping
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID REFERENCES users(id),
  PRIMARY KEY(role_id, permission_id)
);

-- User-Role mapping with resource scoping
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  resource_id UUID, -- Group ID if role is scoped to a group; null for global roles
  resource_type TEXT, -- 'group', 'channel', 'system'
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional role expiration
  is_active BOOLEAN DEFAULT true,
  PRIMARY KEY(user_id, role_id, resource_id, resource_type)
);

-- Groups table for tontine groups
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contribution_amount_sats INTEGER NOT NULL,
  max_members INTEGER NOT NULL,
  current_members INTEGER DEFAULT 0,
  frequency TEXT NOT NULL, -- 'weekly', 'monthly', 'quarterly'
  current_cycle INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'completed', 'disputed'
  
  -- Bitcoin/Lightning specific fields
  multisig_descriptor TEXT, -- Bitcoin multisig descriptor
  lightning_node_id TEXT, -- Lightning node identifier
  watchtower_url TEXT, -- Watchtower for fraud protection
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_payout_date TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- 'active', 'left', 'removed', 'banned'
  
  -- Bitcoin/Lightning specific fields
  bitcoin_address TEXT, -- User's Bitcoin address for payouts
  lightning_pubkey TEXT, -- User's Lightning public key
  
  -- Audit fields
  added_by UUID REFERENCES users(id),
  removed_by UUID REFERENCES users(id),
  
  UNIQUE(group_id, user_id)
);

-- Contributions table for payment tracking
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  amount_sats INTEGER NOT NULL,
  
  -- Lightning payment details
  lightning_invoice TEXT,
  payment_hash TEXT UNIQUE,
  payment_preimage TEXT, -- Encrypted preimage
  payment_route TEXT, -- JSON of payment route
  
  -- Bitcoin on-chain details (for fallback)
  bitcoin_tx_hash TEXT,
  bitcoin_tx_output INTEGER,
  bitcoin_confirmation_height INTEGER,
  
  -- Status and timestamps
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'confirmed', 'failed', 'disputed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Security fields
  receipt_hash TEXT, -- HMAC receipt for verification
  client_idempotency_key TEXT UNIQUE, -- Client-provided idempotency key
  
  -- Audit fields
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Payouts table for cycle completion
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  cycle_number INTEGER NOT NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_sats INTEGER NOT NULL,
  
  -- Payment details
  payment_method TEXT NOT NULL, -- 'lightning', 'bitcoin'
  payment_address TEXT NOT NULL,
  payment_tx_hash TEXT,
  payment_preimage TEXT, -- For Lightning payments
  
  -- Status and timestamps
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'confirmed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Security fields
  receipt_hash TEXT, -- HMAC receipt for verification
  
  -- Audit fields
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Audit logs table for security and compliance
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'login', 'contribution', 'payout', 'role_change'
  resource_type TEXT, -- 'user', 'group', 'contribution', 'payout'
  resource_id UUID,
  details JSONB, -- Additional context (redacted for PII)
  
  -- Security fields
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Cryptographic integrity
  log_hash TEXT, -- Hash of log entry for integrity verification
  signature TEXT -- Digital signature of log entry
);

-- API keys table for service authentication
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL, -- Hashed API key
  permissions JSONB NOT NULL, -- Array of permissions
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES users(id)
);

-- Session management table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Security fields
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for performance and security
CREATE INDEX idx_users_phone_hash ON users(phone_hash);
CREATE INDEX idx_users_nostr_pubkey ON users(nostr_pubkey);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_resource ON user_roles(resource_id, resource_type);
CREATE INDEX idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;

CREATE INDEX idx_groups_status ON groups(status);
CREATE INDEX idx_groups_created_by ON groups(created_by);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_status ON group_members(status);

CREATE INDEX idx_contributions_group_id ON contributions(group_id);
CREATE INDEX idx_contributions_user_id ON contributions(user_id);
CREATE INDEX idx_contributions_status ON contributions(status);
CREATE INDEX idx_contributions_payment_hash ON contributions(payment_hash);
CREATE INDEX idx_contributions_client_key ON contributions(client_idempotency_key);

CREATE INDEX idx_payouts_group_id ON payouts(group_id);
CREATE INDEX idx_payouts_user_id ON payouts(recipient_user_id);
CREATE INDEX idx_payouts_status ON payouts(status);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Insert default system roles
INSERT INTO roles (name, description, is_system_role) VALUES
('member', 'Basic group member with contribution rights', true),
('group_admin', 'Group administrator with management rights', true),
('sys_admin', 'System administrator with full access', true),
('auditor', 'Read-only access for auditing and compliance', true);

-- Insert default permissions
INSERT INTO permissions (name, description, resource_type, action) VALUES
-- Group permissions
('create_group', 'Create new tontine groups', 'group', 'create'),
('manage_group', 'Manage group settings and members', 'group', 'update'),
('view_group', 'View group details and members', 'group', 'read'),
('delete_group', 'Delete groups', 'group', 'delete'),

-- Contribution permissions
('create_contribution', 'Create contribution invoices', 'contribution', 'create'),
('view_contribution', 'View contribution details', 'contribution', 'read'),
('confirm_contribution', 'Confirm contribution payments', 'contribution', 'update'),

-- Payout permissions
('create_payout', 'Create payout transactions', 'payout', 'create'),
('view_payout', 'View payout details', 'payout', 'read'),
('confirm_payout', 'Confirm payout transactions', 'payout', 'update'),

-- User permissions
('manage_users', 'Manage user accounts and roles', 'user', 'update'),
('view_users', 'View user information', 'user', 'read'),

-- System permissions
('view_audit_logs', 'View audit logs and security events', 'system', 'read'),
('manage_roles', 'Manage roles and permissions', 'system', 'update'),
('system_admin', 'Full system administration', 'system', 'all');

-- Assign permissions to roles
-- Member role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'member' AND p.name IN ('view_group', 'create_contribution', 'view_contribution');

-- Group admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'group_admin' AND p.name IN (
  'view_group', 'manage_group', 'view_contribution', 'confirm_contribution',
  'view_payout', 'create_payout', 'confirm_payout'
);

-- System admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'sys_admin';

-- Auditor role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'auditor' AND p.name IN ('view_group', 'view_contribution', 'view_payout', 'view_users', 'view_audit_logs');

-- Add constraints for data integrity
ALTER TABLE contributions ADD CONSTRAINT check_amount_positive CHECK (amount_sats > 0);
ALTER TABLE payouts ADD CONSTRAINT check_payout_amount_positive CHECK (amount_sats > 0);
ALTER TABLE groups ADD CONSTRAINT check_max_members_positive CHECK (max_members > 0);
ALTER TABLE groups ADD CONSTRAINT check_contribution_amount_positive CHECK (contribution_amount_sats > 0);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies for data isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Example RLS policy: Users can only see their own data
CREATE POLICY user_own_data ON users FOR ALL TO authenticated USING (id = current_user_id());

-- Example RLS policy: Group members can only see their group's data
CREATE POLICY group_member_access ON groups FOR SELECT TO authenticated 
USING (id IN (SELECT group_id FROM group_members WHERE user_id = current_user_id()));

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts with privacy-focused design and security features';
COMMENT ON TABLE roles IS 'System roles for role-based access control';
COMMENT ON TABLE permissions IS 'Granular permissions for fine-grained access control';
COMMENT ON TABLE groups IS 'Tontine groups with Bitcoin/Lightning integration';
COMMENT ON TABLE contributions IS 'User contributions with Lightning payment tracking';
COMMENT ON TABLE payouts IS 'Cycle payouts with payment method tracking';
COMMENT ON TABLE audit_logs IS 'Security audit trail with cryptographic integrity';
