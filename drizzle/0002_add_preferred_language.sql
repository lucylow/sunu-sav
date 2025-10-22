-- Add preferred_language field to users table
-- Migration: Add preferred language support

ALTER TABLE users ADD COLUMN preferredLanguage VARCHAR(5) DEFAULT 'fr' COMMENT 'User preferred language: fr, wo, en';

-- Add index for faster language-based queries
CREATE INDEX idx_users_preferred_language ON users(preferredLanguage);
