/*
  # Add public read access policies

  1. Public Read Access
    - Add SELECT policies for public access to content tables
    - `celebrities` - Celebrity profiles viewable by everyone
    - `episodes` - Episode information viewable by everyone  
    - `locations` - Location information viewable by everyone
    - `items` - Item information viewable by everyone
    - `brands` - Brand information viewable by everyone
    - `groups` - Group information viewable by everyone
    - `celebrity_groups` - Celebrity-group relationships viewable by everyone
    - `appearances` - Episode appearances viewable by everyone

  2. Security
    - Only SELECT operations are made public
    - INSERT/UPDATE/DELETE operations still require authentication
    - User-generated content (user_posts, user_answers) remains protected
*/

-- Add public read access to celebrities table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'celebrities' 
    AND policyname = 'Public read access for celebrities'
  ) THEN
    CREATE POLICY "Public read access for celebrities"
      ON celebrities
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Add public read access to episodes table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'episodes' 
    AND policyname = 'Public read access for episodes'
  ) THEN
    CREATE POLICY "Public read access for episodes"
      ON episodes
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Add public read access to locations table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'locations' 
    AND policyname = 'Public read access for locations'
  ) THEN
    CREATE POLICY "Public read access for locations"
      ON locations
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Add public read access to items table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'items' 
    AND policyname = 'Public read access for items'
  ) THEN
    CREATE POLICY "Public read access for items"
      ON items
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Add public read access to brands table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'brands' 
    AND policyname = 'Public read access for brands'
  ) THEN
    CREATE POLICY "Public read access for brands"
      ON brands
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Add public read access to groups table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'groups' 
    AND policyname = 'Public read access for groups'
  ) THEN
    CREATE POLICY "Public read access for groups"
      ON groups
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Add public read access to celebrity_groups table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'celebrity_groups' 
    AND policyname = 'Public read access for celebrity groups'
  ) THEN
    CREATE POLICY "Public read access for celebrity groups"
      ON celebrity_groups
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

-- Add public read access to appearances table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appearances' 
    AND policyname = 'Public read access for appearances'
  ) THEN
    CREATE POLICY "Public read access for appearances"
      ON appearances
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;