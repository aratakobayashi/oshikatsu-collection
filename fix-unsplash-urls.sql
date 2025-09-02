-- Fix 404 Unsplash URLs in database
-- Replace broken URLs with valid ones

-- Fix locations table
UPDATE locations 
SET image_url = REPLACE(image_url, 'photo-1565299624946-b28f40a0ca4b', 'photo-1414235077428-338989a2e8c0')
WHERE image_url LIKE '%photo-1565299624946-b28f40a0ca4b%';

UPDATE locations 
SET image_url = REPLACE(image_url, 'photo-1555529902-1974e9dd9e97', 'photo-1441986300917-64674bd600d8')
WHERE image_url LIKE '%photo-1555529902-1974e9dd9e97%';

UPDATE locations 
SET image_url = REPLACE(image_url, 'photo-1578662996442-48f60103fc96', 'photo-1571019613454-1cb2f99b2d8b')
WHERE image_url LIKE '%photo-1578662996442-48f60103fc9%';

-- Fix celebrities table
UPDATE celebrities 
SET image_url = REPLACE(image_url, 'photo-1565299624946-b28f40a0ca4b', 'photo-1414235077428-338989a2e8c0')
WHERE image_url LIKE '%photo-1565299624946-b28f40a0ca4b%';

UPDATE celebrities 
SET image_url = REPLACE(image_url, 'photo-1555529902-1974e9dd9e97', 'photo-1441986300917-64674bd600d8')
WHERE image_url LIKE '%photo-1555529902-1974e9dd9e97%';

UPDATE celebrities 
SET image_url = REPLACE(image_url, 'photo-1578662996442-48f60103fc96', 'photo-1571019613454-1cb2f99b2d8b')
WHERE image_url LIKE '%photo-1578662996442-48f60103fc9%';

-- Fix items table
UPDATE items 
SET image_url = REPLACE(image_url, 'photo-1565299624946-b28f40a0ca4b', 'photo-1414235077428-338989a2e8c0')
WHERE image_url LIKE '%photo-1565299624946-b28f40a0ca4b%';

UPDATE items 
SET image_url = REPLACE(image_url, 'photo-1555529902-1974e9dd9e97', 'photo-1441986300917-64674bd600d8')
WHERE image_url LIKE '%photo-1555529902-1974e9dd9e97%';

UPDATE items 
SET image_url = REPLACE(image_url, 'photo-1578662996442-48f60103fc96', 'photo-1571019613454-1cb2f99b2d8b')
WHERE image_url LIKE '%photo-1578662996442-48f60103fc9%';

-- Fix episodes table
UPDATE episodes 
SET thumbnail_url = REPLACE(thumbnail_url, 'photo-1565299624946-b28f40a0ca4b', 'photo-1414235077428-338989a2e8c0')
WHERE thumbnail_url LIKE '%photo-1565299624946-b28f40a0ca4b%';

UPDATE episodes 
SET thumbnail_url = REPLACE(thumbnail_url, 'photo-1555529902-1974e9dd9e97', 'photo-1441986300917-64674bd600d8')
WHERE thumbnail_url LIKE '%photo-1555529902-1974e9dd9e97%';

UPDATE episodes 
SET thumbnail_url = REPLACE(thumbnail_url, 'photo-1578662996442-48f60103fc96', 'photo-1571019613454-1cb2f99b2d8b')
WHERE thumbnail_url LIKE '%photo-1578662996442-48f60103fc9%';