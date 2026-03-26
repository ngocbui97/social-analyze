-- ============================================
-- SocialIQ - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  channel_id TEXT,
  channel_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ DEFAULT now()
);

-- 2. Feature tracking logs
CREATE TABLE IF NOT EXISTS feature_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  user_name TEXT,
  feature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AI conversation history
CREATE TABLE IF NOT EXISTS ai_conversations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Saved competitors per user
CREATE TABLE IF NOT EXISTS saved_competitors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  title TEXT,
  subscribers BIGINT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  video_count INT DEFAULT 0,
  thumbnail TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_email, channel_id)
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_competitors ENABLE ROW LEVEL SECURITY;

-- Allow all operations via anon key (app handles auth via Google OAuth, not Supabase Auth)
CREATE POLICY "Allow all for anon" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON feature_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON ai_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON saved_competitors FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_feature_logs_email ON feature_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_feature_logs_feature ON feature_logs(feature);
CREATE INDEX IF NOT EXISTS idx_feature_logs_created ON feature_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_email ON ai_conversations(user_email);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_competitors_email ON saved_competitors(user_email);

-- ============================================
-- 5. User settings (API keys, theme)
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT UNIQUE NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  api_key TEXT,
  theme TEXT DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON user_settings FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_user_settings_email ON user_settings(user_email);

-- ============================================
-- 6. Sponsorship CRM deals
-- ============================================

CREATE TABLE IF NOT EXISTS sponsorships (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  contact_name TEXT,
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN ('prospect', 'negotiating', 'closed')),
  amount BIGINT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON sponsorships FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_sponsorships_email ON sponsorships(user_email);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status);

