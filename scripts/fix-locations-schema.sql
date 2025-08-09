-- Add missing category column to locations table
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS category TEXT;

-- Update the column if it exists but is empty
UPDATE public.locations SET category = 'location' WHERE category IS NULL;