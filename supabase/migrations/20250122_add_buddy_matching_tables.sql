-- Buddy Matching System Tables

-- Table to store buddy match records between two users for an event
CREATE TABLE IF NOT EXISTS public.buddy_matches (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  compatibility_score NUMERIC(5,2) CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  user_1_accepted BOOLEAN DEFAULT false,
  user_2_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_buddy_match UNIQUE(event_id, user_id_1, user_id_2),
  CONSTRAINT different_users CHECK (user_id_1 != user_id_2),
  CONSTRAINT ordered_user_ids CHECK (user_id_1 < user_id_2)
);

-- Table to store user preferences for buddy matching
CREATE TABLE IF NOT EXISTS public.buddy_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  preferred_age_min INT CHECK (preferred_age_min >= 18 AND preferred_age_min <= 100),
  preferred_age_max INT CHECK (preferred_age_max >= 18 AND preferred_age_max <= 100),
  preferred_gender TEXT CHECK (preferred_gender IN ('any', 'male', 'female', 'non-binary', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_age_range CHECK (preferred_age_max IS NULL OR preferred_age_min IS NULL OR preferred_age_max >= preferred_age_min)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_buddy_matches_event ON public.buddy_matches(event_id);
CREATE INDEX IF NOT EXISTS idx_buddy_matches_user1 ON public.buddy_matches(user_id_1);
CREATE INDEX IF NOT EXISTS idx_buddy_matches_user2 ON public.buddy_matches(user_id_2);
CREATE INDEX IF NOT EXISTS idx_buddy_matches_status ON public.buddy_matches(status);
CREATE INDEX IF NOT EXISTS idx_buddy_preferences_enabled ON public.buddy_preferences(enabled) WHERE enabled = true;

-- Row Level Security
ALTER TABLE public.buddy_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for buddy_matches
CREATE POLICY "Users can view their own buddy matches" ON public.buddy_matches
  FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can create buddy matches" ON public.buddy_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can update their own buddy matches" ON public.buddy_matches
  FOR UPDATE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Policies for buddy_preferences
CREATE POLICY "Users can view own preferences" ON public.buddy_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON public.buddy_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.buddy_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.buddy_matches IS 'Stores buddy match relationships between users for specific events';
COMMENT ON TABLE public.buddy_preferences IS 'Stores user preferences for buddy matching algorithm';
COMMENT ON COLUMN public.buddy_matches.compatibility_score IS 'Calculated compatibility score from 0-100';
