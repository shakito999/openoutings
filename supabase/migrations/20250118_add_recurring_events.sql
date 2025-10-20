-- Add recurrence pattern type
create type public.recurrence_pattern as enum ('none','daily','weekly','biweekly','monthly');

-- Add recurring event columns to events table
alter table public.events 
  add column if not exists is_recurring boolean default false,
  add column if not exists recurrence_pattern public.recurrence_pattern default 'none',
  add column if not exists recurrence_end_date date,
  add column if not exists parent_event_id bigint references public.events(id) on delete cascade;

-- Add index for finding recurring events
create index if not exists idx_events_recurring on public.events(is_recurring) where is_recurring = true;
create index if not exists idx_events_parent on public.events(parent_event_id) where parent_event_id is not null;
