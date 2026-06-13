-- Better Bedwars Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Site Settings Table (all configurable from admin panel)
-- ============================================================
CREATE TABLE site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  site_name TEXT NOT NULL DEFAULT 'Better Bedwars',
  description TEXT DEFAULT 'A high-quality Minecraft Bedwars texture pack',
  hero_title TEXT DEFAULT 'Better Bedwars',
  hero_subtitle TEXT DEFAULT 'The Ultimate Bedwars Experience',
  announcement_text TEXT DEFAULT '',
  announcement_enabled BOOLEAN DEFAULT false,
  announcement_type TEXT DEFAULT 'info' CHECK (announcement_type IN ('info', 'warning', 'success', 'danger')),
  featured_pack_id TEXT DEFAULT '',
  discord_url TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  email_contact TEXT DEFAULT '',
  server_ip TEXT DEFAULT '',
  server_name TEXT DEFAULT '',
  footer_text TEXT DEFAULT '© 2024 Better Bedwars. Not affiliated with Mojang Studios.',
  footer_links JSONB DEFAULT '[]',
  logo_url TEXT DEFAULT '',
  favicon_url TEXT DEFAULT '',
  primary_color TEXT DEFAULT '#5c6bc0',
  secondary_color TEXT DEFAULT '#26c6da',
  accent_color TEXT DEFAULT '#ff7043',
  dark_bg TEXT DEFAULT '#0d1117',
  dark_surface TEXT DEFAULT '#161b22',
  dark_card TEXT DEFAULT '#1c2333',
  border_color TEXT DEFAULT '#30363d',
  text_primary TEXT DEFAULT '#e6edf3',
  text_secondary TEXT DEFAULT '#8b949e',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Texture Packs Table
-- ============================================================
CREATE TABLE packs (
  id TEXT PRIMARY KEY, -- slug: 'better-bedwars'
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  short_description TEXT DEFAULT '',
  category TEXT DEFAULT 'bedwars' CHECK (category IN ('bedwars', 'pvp', 'skywars', 'default', 'other')),
  minecraft_versions TEXT[] DEFAULT '{}',
  author TEXT DEFAULT 'Better Bedwars Team',
  icon_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  screenshots TEXT[] DEFAULT '{}',
  download_count BIGINT DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Versions Table (each pack has multiple versions)
-- ============================================================
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id TEXT REFERENCES packs(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  file_size BIGINT DEFAULT 0, -- bytes
  file_format TEXT DEFAULT '.zip',
  minecraft_version TEXT NOT NULL,
  is_latest BOOLEAN DEFAULT false,
  downloads BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pack_id, version)
);

-- ============================================================
-- Downloads Tracking Table
-- ============================================================
CREATE TABLE downloads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pack_id TEXT REFERENCES packs(id) ON DELETE CASCADE,
  version_id UUID REFERENCES versions(id) ON DELETE SET NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Staff Table (for server page)
-- ============================================================
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  minecraft_uuid TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  discord_tag TEXT DEFAULT '',
  rank TEXT DEFAULT 'Member',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Server Rules Table
-- ============================================================
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Server Features / Highlights
-- ============================================================
CREATE TABLE server_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'star',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Admin Users Table
-- ============================================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ============================================================
-- Analytics / Page Views (Basic)
-- ============================================================
CREATE TABLE page_views (
  id BIGSERIAL PRIMARY KEY,
  page TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_views_page ON page_views(page);
CREATE INDEX idx_page_views_date ON page_views(viewed_at);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_packs_featured ON packs(featured) WHERE featured = true;
CREATE INDEX idx_packs_category ON packs(category);
CREATE INDEX idx_packs_downloads ON packs(download_count DESC);
CREATE INDEX idx_versions_pack ON versions(pack_id);
CREATE INDEX idx_versions_latest ON versions(pack_id) WHERE is_latest = true;
CREATE INDEX idx_downloads_pack ON downloads(pack_id);
CREATE INDEX idx_downloads_date ON downloads(downloaded_at);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_features ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public can read packs" ON packs FOR SELECT USING (is_published = true);
CREATE POLICY "Public can read versions" ON versions FOR SELECT USING (true);
CREATE POLICY "Public can read staff" ON staff FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read rules" ON rules FOR SELECT USING (true);
CREATE POLICY "Public can read server_features" ON server_features FOR SELECT USING (true);

-- Only service_role (Netlify Functions) can write
CREATE POLICY "Service role can insert downloads" ON downloads FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage all" ON site_settings FOR ALL USING (true);
CREATE POLICY "Service role can manage all" ON packs FOR ALL USING (true);
CREATE POLICY "Service role can manage all" ON versions FOR ALL USING (true);

-- ============================================================
-- Seed Data
-- ============================================================
INSERT INTO site_settings (id) VALUES ('global');

INSERT INTO packs (id, name, description, short_description, category, minecraft_versions, featured, is_published) VALUES
('better-bedwars', 'Better Bedwars', 'The ultimate Bedwars texture pack designed for clarity, performance, and style. Features crisp textures, optimized models, and vibrant colors to give you the competitive edge.', 'The ultimate Bedwars texture pack', 'bedwars', ARRAY['1.8.9', '1.19', '1.20', '1.21'], true, true),
('lunar-overlay', 'Lunar Overlay', 'A clean overlay pack designed to work perfectly with Lunar Client. Enhances your PvP experience without changing too much.', 'Clean overlay for Lunar Client', 'pvp', ARRAY['1.8.9', '1.19', '1.20'], false, true),
('faithful-bedwars', 'Faithful Bedwars', 'A Bedwars version of the classic Faithful pack. Maintains the original Minecraft feel while optimizing for Bedwars.', 'Classic Faithful for Bedwars', 'bedwars', ARRAY['1.8.9', '1.19', '1.20', '1.21'], false, true);

INSERT INTO versions (pack_id, version, changelog, file_url, file_size, minecraft_version, is_latest, downloads) VALUES
('better-bedwars', '3.0.0', '## What''s New in 3.0.0\n- Complete redesign of all armor textures\n- New sword textures with better visibility\n- Optimized all block textures for performance\n- Fixed glass pane connected textures\n- Added support for 1.21', 'https://example.com/packs/better-bedwars-3.0.0.zip', 15728640, '1.8.9 - 1.21', true, 15234),
('better-bedwars', '2.5.0', '## Changes in 2.5.0\n- Updated hotbar selection indicator\n- New bow pull textures\n- Improved potion color visibility\n- Fixed minor GUI inconsistencies', 'https://example.com/packs/better-bedwars-2.5.0.zip', 14680064, '1.8.9 - 1.20', false, 8921),
('better-bedwars', '2.0.0', '## Major Update 2.0.0\n- Full 64x resolution upgrade\n- New animated block textures\n- Redesigned UI elements\n- Better crosshair options\n- Performance improvements', 'https://example.com/packs/better-bedwars-2.0.0.zip', 12582912, '1.8.9 - 1.19', false, 24567);

INSERT INTO staff (name, role, minecraft_uuid, avatar_url, rank, sort_order) VALUES
('Techno', 'Owner', 'abc123', '', 'Admin', 1),
('DreamWasTaken', 'Developer', 'def456', '', 'Admin', 2),
('George', 'Moderator', 'ghi789', '', 'Mod', 3);

INSERT INTO rules (title, description, category, sort_order) VALUES
('No Cheating', 'Use of hacks, cheats, or unfair modifications is strictly prohibited.', 'General', 1),
('Respect Others', 'Treat all players with respect. No harassment, racism, or toxicity.', 'General', 2),
('No Griefing', 'Destroying or stealing from other players is not allowed.', 'General', 3),
('No Spamming', 'Do not spam chat, advertisements, or inappropriate content.', 'Chat', 4);

INSERT INTO server_features (title, description, icon, sort_order) VALUES
('24/7 Uptime', 'Our servers run around the clock with 99.9% uptime guarantee.', 'server', 1),
('Anti-Cheat Protection', 'Advanced anti-cheat systems keep the game fair for everyone.', 'shield', 2),
('Dedicated Staff', 'Our team is always ready to help with any issues.', 'users', 3),
('Regular Updates', 'New features and improvements added regularly.', 'refresh', 4);