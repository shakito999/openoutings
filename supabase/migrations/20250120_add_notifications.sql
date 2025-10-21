-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'event_joined',
    'event_reminder_24h',
    'event_reminder_1h',
    'event_cancelled',
    'event_updated',
    'new_follower',
    'new_event_from_following'
  )),
  title text NOT NULL,
  message text NOT NULL,
  related_event_id bigint REFERENCES public.events(id) ON DELETE CASCADE,
  related_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- System can insert notifications (for triggers/functions)
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Function to automatically create notification when someone joins an event
CREATE OR REPLACE FUNCTION notify_host_on_event_join()
RETURNS TRIGGER AS $$
DECLARE
  event_record RECORD;
  joiner_name text;
BEGIN
  -- Get event details
  SELECT e.*, p.full_name as host_name
  INTO event_record
  FROM events e
  JOIN profiles p ON e.host_id = p.id
  WHERE e.id = NEW.event_id;
  
  -- Get joiner's name
  SELECT full_name INTO joiner_name
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Don't notify if host is joining their own event
  IF event_record.host_id != NEW.user_id THEN
    -- Create notification for event host
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_event_id,
      related_user_id
    ) VALUES (
      event_record.host_id,
      'event_joined',
      'Нов участник в събитието',
      COALESCE(joiner_name, 'Някой') || ' се присъедини към "' || event_record.title || '"',
      NEW.event_id,
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for event joins
DROP TRIGGER IF EXISTS trigger_notify_host_on_join ON public.event_attendees;
CREATE TRIGGER trigger_notify_host_on_join
  AFTER INSERT ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION notify_host_on_event_join();

-- Function to notify when someone follows you
CREATE OR REPLACE FUNCTION notify_user_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  follower_name text;
BEGIN
  -- Get follower's name
  SELECT full_name INTO follower_name
  FROM profiles
  WHERE id = NEW.follower_id;
  
  -- Create notification for the followed user
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_user_id
  ) VALUES (
    NEW.following_id,
    'new_follower',
    'Нов последовател',
    COALESCE(follower_name, 'Някой') || ' започна да те следва',
    NEW.follower_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follows
DROP TRIGGER IF EXISTS trigger_notify_on_follow ON public.user_follows;
CREATE TRIGGER trigger_notify_on_follow
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_on_follow();

-- Function to notify all attendees when event is cancelled
CREATE OR REPLACE FUNCTION notify_attendees_on_event_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when is_cancelled changes to true
  IF NEW.is_cancelled = true AND (OLD.is_cancelled IS NULL OR OLD.is_cancelled = false) THEN
    -- Notify all attendees except the host
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_event_id
    )
    SELECT 
      ea.user_id,
      'event_cancelled',
      'Събитие отменено',
      'Събитието "' || NEW.title || '" беше отменено',
      NEW.id
    FROM event_attendees ea
    WHERE ea.event_id = NEW.id
      AND ea.user_id != NEW.host_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for event cancellation
DROP TRIGGER IF EXISTS trigger_notify_on_event_cancel ON public.events;
CREATE TRIGGER trigger_notify_on_event_cancel
  AFTER UPDATE ON public.events
  FOR EACH ROW
  WHEN (NEW.is_cancelled = true)
  EXECUTE FUNCTION notify_attendees_on_event_cancel();

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO service_role;
