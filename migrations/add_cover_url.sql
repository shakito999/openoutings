-- Add cover_url column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN profiles.cover_url IS 'Public URL of user profile cover photo from Supabase Storage';
