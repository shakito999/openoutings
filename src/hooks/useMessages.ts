'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { MessageWithSender } from '@/types/messaging'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial messages
  const fetchMessages = useCallback(async (before?: string) => {
    if (!conversationId) return

    try {
      const url = `/api/conversations/${conversationId}/messages?limit=50${before ? `&before=${before}` : ''}`
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch messages')
      }

      if (before) {
        // Prepend older messages
        setMessages(prev => [...data.messages, ...prev])
      } else {
        // Initial load
        setMessages(data.messages)
      }
      setHasMore(data.hasMore)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  // Send a new message
  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Optimistic update - message will also come through realtime
      return data.message
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    }
  }, [conversationId])

  // Load more messages (pagination)
  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      const oldestMessage = messages[0]
      fetchMessages(oldestMessage.created_at)
    }
  }, [messages, hasMore, fetchMessages])

  // Set up realtime subscription
  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetchMessages()

    // Subscribe to new messages in this conversation
    const channel: RealtimeChannel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch full message with sender details
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMessage) {
            setMessages(prev => {
              // Avoid duplicates (in case optimistic update)
              if (prev.some(m => m.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage as MessageWithSender]
            })
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [conversationId, fetchMessages])

  return {
    messages,
    loading,
    hasMore,
    error,
    sendMessage,
    loadMore,
    refetch: () => fetchMessages()
  }
}
