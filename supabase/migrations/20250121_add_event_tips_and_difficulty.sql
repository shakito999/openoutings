-- Add tips/requirements and difficulty level to events table

-- Create difficulty level enum
create type public.difficulty_level as enum ('beginner', 'easy', 'moderate', 'intermediate', 'advanced', 'expert');

-- Add new columns to events table
alter table public.events
  add column if not exists tips text,
  add column if not exists difficulty public.difficulty_level default 'beginner';

-- Add helpful comment
comment on column public.events.tips is 'Tips, suggestions, requirements, or good-to-have items for the event (e.g., "Bring 100 leva spending money", "Wear warm clothes and suitable hiking shoes")';
comment on column public.events.difficulty is 'Difficulty/fitness level required for the event to help participants gauge if it suits them';
