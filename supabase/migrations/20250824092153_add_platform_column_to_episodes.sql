-- Add platform column to episodes table
ALTER TABLE episodes 
ADD COLUMN platform text DEFAULT 'youtube';