-- Add onboarding_completed column to profiles table
alter table public.profiles 
  add column if not exists onboarding_completed boolean default false;

-- Create index for finding users who haven't completed onboarding
create index if not exists idx_profiles_onboarding on public.profiles(onboarding_completed) where onboarding_completed = false;
