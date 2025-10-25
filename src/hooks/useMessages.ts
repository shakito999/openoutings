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

  // Fetch initial messages (client-side)
  const fetchMessages = useCallback(async (before?: string) => {
    if (!conversationId) return

    try {
      let query = supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (before) {
        query = query.lt('created_at', before)
      }

      const { data, error } = await query
      if (error) throw error

      const page = (data || []).reverse() as MessageWithSender[]
      if (before) {
        setMessages(prev => [...page, ...prev])
      } else {
        setMessages(page)
      }
      setHasMore((data || []).length === 50)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  // Send a new message (client-side)
  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim()
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
        `)
        .single()

      if (error) throw error

      // Optimistic add; realtime will also push it
      setMessages(prev => [...prev, data as unknown as MessageWithSender])
      return data
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
