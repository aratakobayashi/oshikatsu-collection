/*
  # Sync existing auth users to users table

  1. Purpose
    - Create users table records for any existing auth.users that don't have corresponding records
    - Ensure foreign key constraints work properly for user_posts

  2. Changes
    - Insert missing users from auth.users into public.users table
    - Use auth metadata or email as fallback for username/display_name
*/

-- Insert existing auth users who don't have records in the users table
INSERT INTO users (id, email, username, display_name)
SELECT 
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'username',
    split_part(au.email, '@', 1)
  ) as username,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'username',
    split_part(au.email, '@', 1)
  ) as display_name
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
  AND au.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;