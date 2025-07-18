/*
  # Celebrity CMS Database Schema

  1. New Tables
    - `celebrities`
      - `id` (uuid, primary key)
      - `name` (text)
      - `slug` (text, unique)
      - `profile_img` (text)
      - `youtube_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `episodes`
      - `id` (uuid, primary key)
      - `celebrity_id` (uuid, foreign key)
      - `title` (text)
      - `date` (date)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `locations`
      - `id` (uuid, primary key)
      - `episode_id` (uuid, foreign key)
      - `name` (text)
      - `address` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `map_embed` (text)
      - `menu_example` (text array)
      - `photo_urls` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `items`
      - `id` (uuid, primary key)
      - `episode_id` (uuid, foreign key)
      - `name` (text)
      - `brand` (text)
      - `affiliate_url` (text)
      - `image_url` (text)
      - `price` (numeric)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data
    - Public read access for celebrity and episode data
*/

-- Create celebrities table
CREATE TABLE IF NOT EXISTS celebrities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  profile_img text DEFAULT '',
  youtube_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create episodes table
CREATE TABLE IF NOT EXISTS episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id uuid NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text DEFAULT '',
  latitude numeric,
  longitude numeric,
  map_embed text DEFAULT '',
  menu_example text[] DEFAULT '{}',
  photo_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id uuid NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text DEFAULT '',
  affiliate_url text DEFAULT '',
  image_url text DEFAULT '',
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Policies for celebrities
CREATE POLICY "Public read access for celebrities"
  ON celebrities
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage celebrities"
  ON celebrities
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for episodes
CREATE POLICY "Public read access for episodes"
  ON episodes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage episodes"
  ON episodes
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for locations
CREATE POLICY "Public read access for locations"
  ON locations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for items
CREATE POLICY "Public read access for items"
  ON items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage items"
  ON items
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_celebrities_slug ON celebrities(slug);
CREATE INDEX IF NOT EXISTS idx_episodes_celebrity_id ON episodes(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_episodes_date ON episodes(date DESC);
CREATE INDEX IF NOT EXISTS idx_locations_episode_id ON locations(episode_id);
CREATE INDEX IF NOT EXISTS idx_items_episode_id ON items(episode_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_celebrities_updated_at
  BEFORE UPDATE ON celebrities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON episodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();