'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { ConversationWithDetails } from '@/types/messaging'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch conversations')
      }

      setConversations(data.conversations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Start or get direct conversation
  const startDirectConversation = useCallback(async (otherUserId: string) => {
    try {
      const response = await fetch('/api/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start conversation')
      }

      // Add to conversations if not already there
      setConversations(prev => {
        if (prev.some(c => c.id === data.conversation.id)) {
          return prev
        }
        return [data.conversation, ...prev]
      })

      return data.conversation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation')
      throw err
    }
  }, [])

  // Get or create event group chat
  const getEventGroupChat = useCallback(async (eventId: number) => {
    try {
      const response = await fetch('/api/conversations/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get event chat')
      }

      // Add to conversations if not already there
      setConversations(prev => {
        if (prev.some(c => c.id === data.conversation.id)) {
          return prev
        }
        return [data.conversation, ...prev]
      })

      return data.conversation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get event chat')
      throw err
    }
  }, [])

  // Set up realtime subscriptions for conversation updates
  useEffect(() => {
    fetchConversations()

    // Subscribe to new conversations and updates
    const conversationsChannel: RealtimeChannel = supabase
      .channel('conversations_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          // Refetch conversations when there's any change
          fetchConversations()
        }
      )
      .subscribe()

    // Subscribe to new messages to update unread count
    const messagesChannel: RealtimeChannel = supabase
      .channel('all_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          // Update unread count for the conversation
          setConversations(prev => 
            prev.map(conv => {
              if (conv.id === payload.new.conversation_id) {
                return {
                  ...conv,
                  unread_count: conv.unread_count + 1,
                  last_message_at: payload.new.created_at
                }
              }
              return conv
            })
          )
        }
      )
      .subscribe()

    return () => {
      conversationsChannel.unsubscribe()
      messagesChannel.unsubscribe()
    }
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
    startDirectConversation,
    getEventGroupChat
  }
}
