export type ConversationType = 'direct' | 'event_group'

export interface Conversation {
  id: string
  type: ConversationType
  event_id: number | null
  created_at: string
  last_message_at: string
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  joined_at: string
  last_read_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface ConversationWithDetails extends Conversation {
  participants: Array<{
    user_id: string
    profile: {
      id: string
      username: string | null
      full_name: string | null
      avatar_url: string | null
    }
  }>
  last_message?: Message
  unread_count: number
  event?: {
    id: number
    title: string
    starts_at: string
    ends_at: string | null
  } | null
}

export interface MessageWithSender extends Message {
  sender: {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
  }
}
