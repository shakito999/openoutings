export type MatchStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export type PreferredGender = 'any' | 'male' | 'female' | 'non-binary' | 'other'

export interface BuddyMatch {
  id: number
  event_id: number
  user_id_1: string
  user_id_2: string
  status: MatchStatus
  compatibility_score: number | null
  user_1_accepted: boolean
  user_2_accepted: boolean
  created_at: string
  updated_at: string
}

export interface BuddyPreferences {
  user_id: string
  enabled: boolean
  preferred_age_min: number | null
  preferred_age_max: number | null
  preferred_gender: PreferredGender | null
  created_at: string
  updated_at: string
}

// Extended types with profile information for UI
export interface BuddyMatchWithProfiles extends BuddyMatch {
  user_1_profile?: {
    id: string
    name: string
    avatar_url: string | null
    gender: string | null
  }
  user_2_profile?: {
    id: string
    name: string
    avatar_url: string | null
    gender: string | null
  }
}

// User data needed for matching algorithm
export interface UserForMatching {
  id: string
  name: string
  avatar_url: string | null
  gender: string | null
  age: number | null
  interests: string[]
  preferences: BuddyPreferences | null
}

// Match result with score
export interface PotentialMatch {
  user: UserForMatching
  compatibility_score: number
  reasons: string[]
}
