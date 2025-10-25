-- Messaging system with cost-efficient design
-- Messages older than 30 days are automatically deleted
-- Event group chats deleted 5 days after event ends

-- Conversation types
CREATE TYPE public.conversation_type AS ENUM ('direct', 'event_group');

-- Conversations table (lightweight, stores metadata only)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  type public.conversation_type NOT NULL,
  event_id bigint REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_message_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT event_group_must_have_event CHECK (
    (type = 'event_group' AND event_id IS NOT NULL) OR 
    (type = 'direct' AND event_id IS NULL)
  )
);

-- Conversation participants (who's in which conversation)
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now() NOT NULL,
  last_read_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

-- Messages table (the main data storage)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT message_content_length CHECK (length(content) > 0 AND length(content) <= 2000)
);

-- Indexes for performance optimization (critical for cost savings)
CREATE INDEX idx_conversations_type ON public.conversations(type);
CREATE INDEX idx_conversations_event ON public.conversations(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);

CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);

-- Critical index for pagination and efficient queries
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- Function to update last_message_at timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update conversation timestamp
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- Function to get or create direct conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  user_id_1 uuid,
  user_id_2 uuid
)
RETURNS uuid AS $$
DECLARE
  conversation_uuid uuid;
  are_mutual_followers boolean;
BEGIN
  -- Check if users follow each other (mutual follow requirement)
  SELECT EXISTS (
    SELECT 1 FROM public.user_follows 
    WHERE follower_id = user_id_1 AND following_id = user_id_2
  ) AND EXISTS (
    SELECT 1 FROM public.user_follows 
    WHERE follower_id = user_id_2 AND following_id = user_id_1
  ) INTO are_mutual_followers;
  
  IF NOT are_mutual_followers THEN
    RAISE EXCEPTION 'Users must follow each other to start a conversation';
  END IF;

  -- Try to find existing conversation
  SELECT c.id INTO conversation_uuid
  FROM public.conversations c
  WHERE c.type = 'direct'
    AND c.id IN (
      SELECT conversation_id FROM public.conversation_participants WHERE user_id = user_id_1
    )
    AND c.id IN (
      SELECT conversation_id FROM public.conversation_participants WHERE user_id = user_id_2
    )
  LIMIT 1;

  -- Create new conversation if it doesn't exist
  IF conversation_uuid IS NULL THEN
    INSERT INTO public.conversations (type)
    VALUES ('direct')
    RETURNING id INTO conversation_uuid;

    -- Add both participants
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES 
      (conversation_uuid, user_id_1),
      (conversation_uuid, user_id_2);
  END IF;

  RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create event group chat automatically
CREATE OR REPLACE FUNCTION public.create_event_group_chat(p_event_id bigint)
RETURNS uuid AS $$
DECLARE
  conversation_uuid uuid;
BEGIN
  -- Check if group chat already exists
  SELECT id INTO conversation_uuid
  FROM public.conversations
  WHERE type = 'event_group' AND event_id = p_event_id
  LIMIT 1;

  IF conversation_uuid IS NOT NULL THEN
    RETURN conversation_uuid;
  END IF;

  -- Create new event group conversation
  INSERT INTO public.conversations (type, event_id)
  VALUES ('event_group', p_event_id)
  RETURNING id INTO conversation_uuid;

  -- Add all event participants to the conversation
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  SELECT conversation_uuid, user_id
  FROM public.event_attendees
  WHERE event_id = p_event_id;

  RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-add new event participants to group chat
CREATE OR REPLACE FUNCTION public.add_participant_to_event_chat()
RETURNS TRIGGER AS $$
DECLARE
  chat_id uuid;
BEGIN
  -- Find the event group chat
  SELECT id INTO chat_id
  FROM public.conversations
  WHERE type = 'event_group' AND event_id = NEW.event_id;

  -- If chat exists, add the new participant
  IF chat_id IS NOT NULL THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (chat_id, NEW.user_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-add participants when they join an event
CREATE TRIGGER trigger_add_to_event_chat
  AFTER INSERT ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.add_participant_to_event_chat();

-- CRITICAL: Cleanup function for message retention (cost savings)
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS void AS $$
BEGIN
  -- Delete messages older than 30 days
  DELETE FROM public.messages
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete event group chat messages 5 days after event ends
  DELETE FROM public.messages m
  USING public.conversations c
  JOIN public.events e ON c.event_id = e.id
  WHERE m.conversation_id = c.id
    AND c.type = 'event_group'
    AND (
      (e.ends_at IS NOT NULL AND e.ends_at < NOW() - INTERVAL '5 days') OR
      (e.ends_at IS NULL AND e.starts_at < NOW() - INTERVAL '5 days')
    );

  -- Delete empty conversations (no messages)
  DELETE FROM public.conversations c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.messages m WHERE m.conversation_id = c.id
  ) AND c.created_at < NOW() - INTERVAL '1 day';

  RAISE NOTICE 'Message cleanup completed';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.cleanup_old_messages() IS 
'Deletes messages older than 30 days and event group messages 5 days after event ends. Run daily via pg_cron or edge function.';

-- Row Level Security Policies

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can only see conversations they're part of
CREATE POLICY "Users can view their conversations"
  ON public.conversations
  FOR SELECT
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Conversation participants: Users can view participants in their conversations
CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Participants can update their own last_read_at
CREATE POLICY "Users can update their own participant record"
  ON public.conversation_participants
  FOR UPDATE
  USING (user_id = auth.uid());

-- Messages: Users can only see messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Messages: Users can send messages to their conversations
CREATE POLICY "Users can send messages to their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT ALL ON TABLE public.conversations TO authenticated;
GRANT ALL ON TABLE public.conversation_participants TO authenticated;
GRANT ALL ON TABLE public.messages TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_event_group_chat(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_messages() TO service_role;

-- Enable realtime for messages (users will only receive messages from their conversations due to RLS)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
