-- Check how many records have broken Unsplash URLs
-- Run this first to see the impact

SELECT 'locations' as table_name, COUNT(*) as count
FROM locations 
WHERE image_url LIKE '%photo-1565299624946-b28f40a0ca4b%'
   OR image_url LIKE '%photo-1555529902-1974e9dd9e97%'
   OR image_url LIKE '%photo-1578662996442-48f60103fc9%'

UNION ALL

SELECT 'celebrities' as table_name, COUNT(*) as count
FROM celebrities 
WHERE image_url LIKE '%photo-1565299624946-b28f40a0ca4b%'
   OR image_url LIKE '%photo-1555529902-1974e9dd9e97%'
   OR image_url LIKE '%photo-1578662996442-48f60103fc9%'

UNION ALL

SELECT 'items' as table_name, COUNT(*) as count
FROM items 
WHERE image_url LIKE '%photo-1565299624946-b28f40a0ca4b%'
   OR image_url LIKE '%photo-1555529902-1974e9dd9e97%'
   OR image_url LIKE '%photo-1578662996442-48f60103fc9%'

UNION ALL

SELECT 'episodes' as table_name, COUNT(*) as count
FROM episodes 
WHERE thumbnail_url LIKE '%photo-1565299624946-b28f40a0ca4b%'
   OR thumbnail_url LIKE '%photo-1555529902-1974e9dd9e97%'
   OR thumbnail_url LIKE '%photo-1578662996442-48f60103fc9%';