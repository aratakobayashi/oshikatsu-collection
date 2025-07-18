/*
  # Extended Celebrity CMS Database Schema

  1. New Tables
    - `users` - User management for UGC features
    - `groups` - Celebrity groups/units
    - `celebrity_groups` - Many-to-many relationship between celebrities and groups
    - `brands` - Brand information for items
    - `appearances` - Junction table for episode appearances
    - `user_posts` - User-generated content posts
    - `user_answers` - User answers to posts

  2. Extended Tables
    - Add new columns to existing `episodes` table
    - Add new columns to existing `items` table
    - Add new columns to existing `locations` table

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for public read and authenticated user management
*/

-- Users table (ユーザー管理)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Groups table (グループ・ユニット)
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL,
  image_url text DEFAULT '',
  description text DEFAULT '',
  debut_date date,
  official_site text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add CHECK constraint for groups.type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'groups_type_check' AND table_name = 'groups'
  ) THEN
    ALTER TABLE groups ADD CONSTRAINT groups_type_check 
    CHECK (type IN ('idol', 'youtuber', 'band', 'comedy', 'actor', 'other'));
  END IF;
END $$;

-- Celebrity Groups (多対多関係)
CREATE TABLE IF NOT EXISTS celebrity_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id uuid NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  role text DEFAULT '',
  joined_date date,
  left_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint for celebrity_groups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'celebrity_groups_celebrity_id_group_id_key' AND table_name = 'celebrity_groups'
  ) THEN
    ALTER TABLE celebrity_groups ADD CONSTRAINT celebrity_groups_celebrity_id_group_id_key 
    UNIQUE(celebrity_id, group_id);
  END IF;
END $$;

-- Brands table (ブランド)
CREATE TABLE IF NOT EXISTS brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text DEFAULT '',
  official_site text DEFAULT '',
  description text DEFAULT '',
  country text DEFAULT '',
  founded_year integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add new columns to existing celebrities table
DO $$
BEGIN
  -- Add image_url column (rename from profile_img if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'celebrities' AND column_name = 'image_url'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'celebrities' AND column_name = 'profile_img'
    ) THEN
      ALTER TABLE celebrities RENAME COLUMN profile_img TO image_url;
    ELSE
      ALTER TABLE celebrities ADD COLUMN image_url text DEFAULT '';
    END IF;
  END IF;

  -- Add sns_links column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'celebrities' AND column_name = 'sns_links'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN sns_links jsonb DEFAULT '{}';
  END IF;

  -- Add bio column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'celebrities' AND column_name = 'bio'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN bio text DEFAULT '';
  END IF;

  -- Add birth_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'celebrities' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN birth_date date;
  END IF;

  -- Add nationality column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'celebrities' AND column_name = 'nationality'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN nationality text DEFAULT '';
  END IF;
END $$;

-- Add new columns to existing episodes table
DO $$
BEGIN
  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'description'
  ) THEN
    ALTER TABLE episodes ADD COLUMN description text DEFAULT '';
  END IF;

  -- Add video_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE episodes ADD COLUMN video_url text DEFAULT '';
  END IF;

  -- Add thumbnail_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE episodes ADD COLUMN thumbnail_url text DEFAULT '';
  END IF;

  -- Add platform column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'platform'
  ) THEN
    ALTER TABLE episodes ADD COLUMN platform text DEFAULT '';
  END IF;

  -- Add duration_minutes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE episodes ADD COLUMN duration_minutes integer;
  END IF;

  -- Add view_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE episodes ADD COLUMN view_count bigint DEFAULT 0;
  END IF;
END $$;

-- Add CHECK constraint for episodes.platform (after column is added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'episodes_platform_check' AND table_name = 'episodes'
  ) THEN
    ALTER TABLE episodes ADD CONSTRAINT episodes_platform_check 
    CHECK (platform IN ('', 'youtube', 'tv', 'instagram', 'tiktok', 'other'));
  END IF;
END $$;

-- Add new columns to existing items table
DO $$
BEGIN
  -- Add brand_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'brand_id'
  ) THEN
    ALTER TABLE items ADD COLUMN brand_id uuid REFERENCES brands(id) ON DELETE SET NULL;
  END IF;

  -- Add category column (rename from existing if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'category'
  ) THEN
    ALTER TABLE items ADD COLUMN category text NOT NULL DEFAULT 'other';
  END IF;

  -- Add subcategory column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE items ADD COLUMN subcategory text DEFAULT '';
  END IF;

  -- Add currency column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'currency'
  ) THEN
    ALTER TABLE items ADD COLUMN currency text DEFAULT 'JPY';
  END IF;

  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'description'
  ) THEN
    ALTER TABLE items ADD COLUMN description text DEFAULT '';
  END IF;

  -- Add color column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'color'
  ) THEN
    ALTER TABLE items ADD COLUMN color text DEFAULT '';
  END IF;

  -- Add size column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'size'
  ) THEN
    ALTER TABLE items ADD COLUMN size text DEFAULT '';
  END IF;

  -- Add material column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'material'
  ) THEN
    ALTER TABLE items ADD COLUMN material text DEFAULT '';
  END IF;

  -- Add is_available column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE items ADD COLUMN is_available boolean DEFAULT true;
  END IF;
END $$;

-- Add CHECK constraint for items.category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'items_category_check' AND table_name = 'items'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_category_check 
    CHECK (category IN ('clothing', 'shoes', 'bag', 'accessory', 'jewelry', 'watch', 'cosmetics', 'other'));
  END IF;
END $$;

-- Add new columns to existing locations table
DO $$
BEGIN
  -- Add category column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'category'
  ) THEN
    ALTER TABLE locations ADD COLUMN category text NOT NULL DEFAULT 'other';
  END IF;

  -- Add phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'phone'
  ) THEN
    ALTER TABLE locations ADD COLUMN phone text DEFAULT '';
  END IF;

  -- Add website column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'website'
  ) THEN
    ALTER TABLE locations ADD COLUMN website text DEFAULT '';
  END IF;

  -- Add reservation_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'reservation_url'
  ) THEN
    ALTER TABLE locations ADD COLUMN reservation_url text DEFAULT '';
  END IF;

  -- Add map_url column (rename from map_embed if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'map_url'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'locations' AND column_name = 'map_embed'
    ) THEN
      ALTER TABLE locations RENAME COLUMN map_embed TO map_url;
    ELSE
      ALTER TABLE locations ADD COLUMN map_url text DEFAULT '';
    END IF;
  END IF;

  -- Add opening_hours column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'opening_hours'
  ) THEN
    ALTER TABLE locations ADD COLUMN opening_hours jsonb DEFAULT '{}';
  END IF;

  -- Add price_range column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'price_range'
  ) THEN
    ALTER TABLE locations ADD COLUMN price_range text DEFAULT '';
  END IF;

  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'description'
  ) THEN
    ALTER TABLE locations ADD COLUMN description text DEFAULT '';
  END IF;

  -- Add image_urls column (rename from photo_urls if needed)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'image_urls'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'locations' AND column_name = 'photo_urls'
    ) THEN
      ALTER TABLE locations RENAME COLUMN photo_urls TO image_urls;
    ELSE
      ALTER TABLE locations ADD COLUMN image_urls text[] DEFAULT '{}';
    END IF;
  END IF;
END $$;

-- Add CHECK constraint for locations.category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'locations_category_check' AND table_name = 'locations'
  ) THEN
    ALTER TABLE locations ADD CONSTRAINT locations_category_check 
    CHECK (category IN ('restaurant', 'cafe', 'shop', 'hotel', 'venue', 'tourist_spot', 'other'));
  END IF;
END $$;

-- Appearances table (登場情報 - 中間テーブル)
CREATE TABLE IF NOT EXISTS appearances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  timestamp_start integer, -- 秒単位
  timestamp_end integer,   -- 秒単位
  description text DEFAULT '',
  screenshot_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add CHECK constraint for appearances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'appearances_item_or_location_check' AND table_name = 'appearances'
  ) THEN
    ALTER TABLE appearances ADD CONSTRAINT appearances_item_or_location_check 
    CHECK (item_id IS NOT NULL OR location_id IS NOT NULL);
  END IF;
END $$;

-- User Posts table (ユーザー投稿)
CREATE TABLE IF NOT EXISTS user_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  image_urls text[] DEFAULT '{}',
  celebrity_id uuid REFERENCES celebrities(id) ON DELETE SET NULL,
  episode_id uuid REFERENCES episodes(id) ON DELETE SET NULL,
  status text DEFAULT 'open',
  tags text[] DEFAULT '{}',
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add CHECK constraint for user_posts.status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_posts_status_check' AND table_name = 'user_posts'
  ) THEN
    ALTER TABLE user_posts ADD CONSTRAINT user_posts_status_check 
    CHECK (status IN ('open', 'solved', 'closed'));
  END IF;
END $$;

-- User Answers table (ユーザー回答)
CREATE TABLE IF NOT EXISTS user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES user_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  item_id uuid REFERENCES items(id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  confidence_level integer DEFAULT 1,
  is_verified boolean DEFAULT false,
  like_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add CHECK constraint for user_answers.confidence_level
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_answers_confidence_level_check' AND table_name = 'user_answers'
  ) THEN
    ALTER TABLE user_answers ADD CONSTRAINT user_answers_confidence_level_check 
    CHECK (confidence_level BETWEEN 1 AND 5);
  END IF;
END $$;

-- Enable Row Level Security on new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE celebrity_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE appearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can read all profiles"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for Groups (公開読み取り可能)
CREATE POLICY "Public read access for groups"
  ON groups
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage groups"
  ON groups
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated');

-- RLS Policies for Celebrity Groups (公開読み取り可能)
CREATE POLICY "Public read access for celebrity groups"
  ON celebrity_groups
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage celebrity groups"
  ON celebrity_groups
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated');

-- RLS Policies for Brands (公開読み取り可能)
CREATE POLICY "Public read access for brands"
  ON brands
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage brands"
  ON brands
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated');

-- RLS Policies for Appearances (公開読み取り可能)
CREATE POLICY "Public read access for appearances"
  ON appearances
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage appearances"
  ON appearances
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated');

-- RLS Policies for User Posts (公開読み取り可能)
CREATE POLICY "Public read access for user posts"
  ON user_posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create posts"
  ON user_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON user_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON user_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for User Answers (公開読み取り可能)
CREATE POLICY "Public read access for user answers"
  ON user_answers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create answers"
  ON user_answers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON user_answers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
  ON user_answers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_groups_slug ON groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_type ON groups(type);
CREATE INDEX IF NOT EXISTS idx_celebrity_groups_celebrity_id ON celebrity_groups(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_celebrity_groups_group_id ON celebrity_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_episodes_platform ON episodes(platform);
CREATE INDEX IF NOT EXISTS idx_items_brand_id ON items(brand_id);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_appearances_episode_id ON appearances(episode_id);
CREATE INDEX IF NOT EXISTS idx_appearances_item_id ON appearances(item_id);
CREATE INDEX IF NOT EXISTS idx_appearances_location_id ON appearances(location_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_user_id ON user_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_celebrity_id ON user_posts(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_episode_id ON user_posts(episode_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_status ON user_posts(status);
CREATE INDEX IF NOT EXISTS idx_user_posts_created_at ON user_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_answers_post_id ON user_answers(post_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_item_id ON user_answers(item_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_location_id ON user_answers(location_id);

-- Create triggers for updated_at on new tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_celebrity_groups_updated_at
  BEFORE UPDATE ON celebrity_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appearances_updated_at
  BEFORE UPDATE ON appearances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_posts_updated_at
  BEFORE UPDATE ON user_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_answers_updated_at
  BEFORE UPDATE ON user_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();