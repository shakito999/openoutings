-- Event Cancellation and Auto-Cleanup Migration

-- 1. Add cancellation fields to events table
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS is_cancelled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for filtering cancelled events
CREATE INDEX IF NOT EXISTS idx_events_cancelled ON public.events(is_cancelled) WHERE is_cancelled = false;

-- 2. Function to delete old events and their associated data
CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS void AS $$
DECLARE
  old_event RECORD;
  photo_path TEXT;
BEGIN
  -- Find events that ended more than 30 days ago
  FOR old_event IN 
    SELECT id 
    FROM public.events 
    WHERE ends_at < NOW() - INTERVAL '30 days'
       OR (starts_at < NOW() - INTERVAL '30 days' AND ends_at IS NULL)
  LOOP
    -- Delete photos from storage for this event
    FOR photo_path IN 
      SELECT storage_path 
      FROM public.event_photos 
      WHERE event_id = old_event.id
    LOOP
      -- Note: Storage deletion needs to be done via Supabase client
      -- The photos will be orphaned but can be cleaned separately
      RAISE NOTICE 'Event % photo marked for deletion: %', old_event.id, photo_path;
    END LOOP;
    
    -- Delete the event (cascade will handle related records)
    DELETE FROM public.events WHERE id = old_event.id;
    
    RAISE NOTICE 'Deleted old event: %', old_event.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a function to safely cancel an event
CREATE OR REPLACE FUNCTION cancel_event(
  p_event_id bigint,
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_host_id uuid;
BEGIN
  -- Check if user is the host
  SELECT host_id INTO v_host_id
  FROM public.events
  WHERE id = p_event_id;
  
  IF v_host_id != p_user_id THEN
    RAISE EXCEPTION 'Only the event host can cancel the event';
  END IF;
  
  -- Cancel the event
  UPDATE public.events
  SET 
    is_cancelled = true,
    cancelled_at = NOW(),
    cancelled_by = p_user_id
  WHERE id = p_event_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 4. Comment explaining manual cleanup trigger
COMMENT ON FUNCTION cleanup_old_events() IS 
'Call this function daily via Edge Function or pg_cron to delete events older than 30 days. Photos should be deleted from storage bucket separately.';

-- 5. Grant execute permission
GRANT EXECUTE ON FUNCTION cancel_event TO authenticated;
