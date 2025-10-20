# OpenOutings Functional Spec

## Overview
A responsive web app (mobile/desktop) to find activity partners and coordinate schedules. Users can create events with capacity and optional gender restriction, upload downscaled images, pick interests to personalize discovery, search/filter events, review hosts, and run availability polls for groups.

## Key Features
- Auth: Email/password and OAuth (Google, GitHub) via Supabase Auth.
- Profiles: username, avatar, interests.
- Interests: curated list; users pick; used to highlight matching events.
- Events: create/manage; fields: title, description, time, capacity, gender, address, map location, photos.
- Photos: all uploads downscaled server-side before storage.
- Maps: OpenStreetMap via React Leaflet.
- Discovery: list + search with filters (date range, interests, capacity, gender, free/paid).
- Reviews: 1–5 star ratings and comments for hosts.
- Polls: 1–14 day window, 4 time slots/day (morning/noon/afternoon/evening); highlight best times by votes.
- Future monetization: paid events with price field (inactive by default).

## Data Model (Supabase)
See `supabase/schema.sql` for tables: profiles, interests, user_interests, events, event_photos, event_attendees, reviews, availability_polls, poll_slots, poll_votes; plus enums `gender_restriction`, `day_slot`.

## Security & RLS
- Enable RLS on all tables and author policies in Supabase: public read on events, owners-only write; user-interests only by self; reviews: one per reviewer/host.
- Storage: bucket `images` public read, authenticated upload via server route; service role key only on server.

## Image Processing
- API: `POST /api/images/upload` with `file` field.
- Downscale to max 1600x1600, JPEG quality 80, EXIF-based rotation.

## Maps
- OSM tiles via env-configured URL/attribution. Location stored as lat/lng + address.

## Poll Algorithm (MVP)
- Score = count of positive votes per slot. Highlight slots with max score.
- Later: weight by “maybe” votes, tie-breaking by earliest time, interests alignment.

## Testing
- Unit: Vitest + RTL, jsdom for components.
- E2E: Playwright basic flows (auth UI, create event, search, poll create).

## Setup
1) Create Supabase project; set URL and anon key in `.env.local`.
2) Run `supabase/schema.sql` in the SQL editor; create storage bucket `images`.
3) Set `SUPABASE_SERVICE_ROLE_KEY` only in server environment (never commit).
4) npm scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `e2e`.
