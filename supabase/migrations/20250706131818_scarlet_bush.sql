/*
  # Add insert policy for users table

  1. Security
    - Add RLS policy to allow authenticated users to insert their own user records
    - This enables user registration to work properly with Supabase Auth

  2. Changes
    - Add "Authenticated users can insert" policy for users table
    - Policy allows INSERT operations for authenticated users
    - Users can only insert records with their own auth.uid() as the id
*/

CREATE POLICY "Authenticated users can insert"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);