-- Create event_interests junction table
create table if not exists public.event_interests (
  event_id bigint references public.events(id) on delete cascade,
  interest_id bigint references public.interests(id) on delete cascade,
  primary key (event_id, interest_id)
);

-- Enable RLS
alter table public.event_interests enable row level security;

-- Policy: Anyone can read event interests
create policy "public read event_interests"
  on public.event_interests for select
  using (true);

-- Policy: Authenticated users can insert event interests (for their own events)
create policy "users insert event_interests"
  on public.event_interests for insert
  with check (
    exists (
      select 1 from public.events
      where events.id = event_id
      and events.host_id = auth.uid()
    )
  );

-- Policy: Event hosts can delete their event interests
create policy "hosts delete event_interests"
  on public.event_interests for delete
  using (
    exists (
      select 1 from public.events
      where events.id = event_id
      and events.host_id = auth.uid()
    )
  );
