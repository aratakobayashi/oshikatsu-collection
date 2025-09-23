/*
  # Articles System Database Schema

  1. New Tables
    - `categories`
      - WordPress blog categories (8 categories)
      - Color coding and ordering

    - `articles`
      - Blog articles with SEO features
      - WordPress migration support
      - View tracking and featured status

    - `article_celebrities`
      - Many-to-many relationship between articles and celebrities

    - `article_items`
      - Many-to-many relationship between articles and items

    - `article_locations`
      - Many-to-many relationship between articles and locations
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3B82F6', -- Default blue color
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text DEFAULT '',
  featured_image text DEFAULT '',
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  view_count integer DEFAULT 0,
  featured boolean DEFAULT false,
  seo_title text DEFAULT '',
  meta_description text DEFAULT '',
  wordpress_id integer, -- For WordPress migration
  wordpress_slug text, -- For WordPress migration
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create article relationships tables
CREATE TABLE IF NOT EXISTS article_celebrities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  celebrity_id uuid NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(article_id, celebrity_id)
);

CREATE TABLE IF NOT EXISTS article_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(article_id, item_id)
);

CREATE TABLE IF NOT EXISTS article_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(article_id, location_id)
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_locations ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Public read access for categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for articles
CREATE POLICY "Public read access for published articles"
  ON articles
  FOR SELECT
  TO public
  USING (status = 'published');

CREATE POLICY "Authenticated users can manage articles"
  ON articles
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for article relationships
CREATE POLICY "Public read access for article_celebrities"
  ON article_celebrities
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage article_celebrities"
  ON article_celebrities
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public read access for article_items"
  ON article_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage article_items"
  ON article_items
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Public read access for article_locations"
  ON article_locations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage article_locations"
  ON article_locations
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_order_index ON categories(order_index);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured);
CREATE INDEX IF NOT EXISTS idx_articles_wordpress_id ON articles(wordpress_id);
CREATE INDEX IF NOT EXISTS idx_articles_wordpress_slug ON articles(wordpress_slug);
CREATE INDEX IF NOT EXISTS idx_article_celebrities_article_id ON article_celebrities(article_id);
CREATE INDEX IF NOT EXISTS idx_article_celebrities_celebrity_id ON article_celebrities(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_article_items_article_id ON article_items(article_id);
CREATE INDEX IF NOT EXISTS idx_article_items_item_id ON article_items(item_id);
CREATE INDEX IF NOT EXISTS idx_article_locations_article_id ON article_locations(article_id);
CREATE INDEX IF NOT EXISTS idx_article_locations_location_id ON article_locations(location_id);

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories based on WordPress blog
INSERT INTO categories (name, slug, description, color, order_index) VALUES
  ('はじめての推し活', 'beginner-oshi', '推し活を始める方向けのガイド', '#F59E0B', 1),
  ('参戦準備・コーデ', 'live-preparation', 'ライブ参戦の準備とコーディネート', '#EF4444', 2),
  ('ライブ会場ガイド', 'venue-guide', 'ライブ会場の情報とガイド', '#10B981', 3),
  ('アイドル紹介', 'idol-introduction', 'アイドルグループの紹介記事', '#8B5CF6', 4),
  ('ライブレポート', 'live-report', 'ライブ参戦レポート', '#F97316', 5),
  ('推し活×節約・お得術', 'saving-tips', '推し活を賢く楽しむ節約術', '#06B6D4', 6),
  ('男性の推し活', 'male-oshi', '男性ファンの推し活情報', '#3B82F6', 7),
  ('痛バ・グッズ・収納術', 'goods-storage', 'グッズの収納と痛バの作り方', '#EC4899', 8);