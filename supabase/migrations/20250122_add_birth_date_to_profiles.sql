-- Add birth_date column to profiles table
-- This will be used for age-based matching in buddy system and general personalization

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS birth_date date;

-- Add index for age-based queries (optional but recommended for performance)
CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles(birth_date) 
WHERE birth_date IS NOT NULL;

-- Add a check constraint to ensure birth_date is reasonable (not in the future, not too old)
ALTER TABLE public.profiles
  ADD CONSTRAINT birth_date_reasonable CHECK (
    birth_date IS NULL OR (
      birth_date >= '1900-01-01' AND 
      birth_date <= CURRENT_DATE
    )
  );

COMMENT ON COLUMN public.profiles.birth_date IS 'User birth date for age-based matching and personalization. Optional field.';

-- Add gender column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'non-binary', 'other', 'prefer-not-to-say'));

-- Add privacy settings columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_age boolean DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_gender boolean DEFAULT false;

COMMENT ON COLUMN public.profiles.gender IS 'User gender identity. Optional field.';
COMMENT ON COLUMN public.profiles.show_age IS 'Whether to display age publicly on profile.';
COMMENT ON COLUMN public.profiles.show_gender IS 'Whether to display gender publicly on profile.';
