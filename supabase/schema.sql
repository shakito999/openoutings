-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Interests
create table if not exists public.interests (
  id bigserial primary key,
  name text unique not null
);

create table if not exists public.user_interests (
  user_id uuid references public.profiles(id) on delete cascade,
  interest_id bigint references public.interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

-- Events
create type public.gender_restriction as enum ('none','male','female','other');
create type public.recurrence_pattern as enum ('none','daily','weekly','biweekly','monthly');

create table if not exists public.events (
  id bigserial primary key,
  host_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity int check (capacity > 0),
  gender public.gender_restriction default 'none',
  address text,
  lat double precision,
  lng double precision,
  is_paid boolean default false,
  price_cents int,
  is_recurring boolean default false,
  recurrence_pattern public.recurrence_pattern default 'none',
  recurrence_end_date date,
  parent_event_id bigint references public.events(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.event_photos (
  id bigserial primary key,
  event_id bigint references public.events(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz default now()
);

create table if not exists public.event_attendees (
  event_id bigint references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- Reviews for hosts
create table if not exists public.reviews (
  id bigserial primary key,
  host_id uuid references public.profiles(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete cascade,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (host_id, reviewer_id)
);

-- User follows
create table if not exists public.user_follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- Availability polls
create type public.day_slot as enum ('morning','noon','afternoon','evening');

create table if not exists public.availability_polls (
  id bigserial primary key,
  creator_id uuid references public.profiles(id) on delete set null,
  title text not null,
  starts_on date not null,
  ends_on date not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.poll_slots (
  id bigserial primary key,
  poll_id bigint references public.availability_polls(id) on delete cascade,
  on_date date not null,
  slot public.day_slot not null,
  unique (poll_id, on_date, slot)
);

create table if not exists public.poll_votes (
  slot_id bigint references public.poll_slots(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  preference smallint default 1, -- 1 = available, 0 = maybe, -1 = no
  primary key (slot_id, user_id)
);

-- Suggested RLS (enable and refine in Supabase project):
-- alter table public.profiles enable row level security;
-- alter table public.events enable row level security;
-- policy "public read events" on public.events for select using (true);
-- policy "auth users insert events" on public.events for insert with check (auth.uid() = host_id);
