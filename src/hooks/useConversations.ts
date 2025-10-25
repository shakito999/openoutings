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
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[useConversations] auth user:', user?.id)
      if (!user) {
        setLoading(false)
        return
      }

      // Step 1: Get conversation IDs the user is part of
      const { data: participantRows, error: partsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)

      if (partsError) {
        console.error('[useConversations] participants error:', partsError)
        throw partsError
      }
      console.log('[useConversations] participantRows:', participantRows)
      const convIds = (participantRows || []).map((r: any) => r.conversation_id)
      console.log('[useConversations] convIds:', convIds)
      if (convIds.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // Step 2: Fetch conversations with participants and event
      const { data: convs, error: convsError } = await supabase
        .from('conversations')
        .select(`
          id, type, event_id, created_at, last_message_at,
          participants:conversation_participants(
            user_id,
            last_read_at,
            profile:profiles(id, username, full_name, avatar_url)
          ),
          event:events(id, title, starts_at, ends_at)
        `)
        .in('id', convIds)
        .order('last_message_at', { ascending: false })

      if (convsError) {
        console.error('[useConversations] conversations error:', convsError)
        throw convsError
      }
      console.log('[useConversations] conversations fetched:', convs?.length)

      // Step 3: Fetch latest messages for all conversations (in one query)
      const { data: recentMessages, error: msgsError } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, conversation_id')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })

      if (msgsError) {
        console.error('[useConversations] recentMessages error:', msgsError)
        throw msgsError
      }

      const lastByConv = new Map<string, any>()
      for (const m of recentMessages || []) {
        if (!lastByConv.has(m.conversation_id)) {
          lastByConv.set(m.conversation_id, m)
        }
      }

      // Step 4: Compute unread counts per conversation
      const conversationsWithMeta = await Promise.all(
        (convs || []).map(async (conv: any) => {
          const userParticipant = conv.participants.find((p: any) => p.user_id === user.id)
          let unread = 0
          if (userParticipant) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .gt('created_at', userParticipant.last_read_at || new Date(0).toISOString())
            unread = count || 0
          }
          return {
            ...conv,
            unread_count: unread,
            last_message: lastByConv.get(conv.id) || null,
          }
        })
      )

      console.log('[useConversations] final conversations:', conversationsWithMeta?.length)
      setConversations(conversationsWithMeta)
    } catch (err) {
      console.error('[useConversations] fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Start or get direct conversation
  const startDirectConversation = useCallback(async (otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Call the database function to get or create conversation
      const { data: conversationId, error } = await supabase
        .rpc('get_or_create_direct_conversation', {
          user_id_1: user.id,
          user_id_2: otherUserId
        })

      if (error) throw error

      // Fetch the full conversation details
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            profile:profiles(id, username, full_name, avatar_url)
          )
        `)
        .eq('id', conversationId)
        .single()

      if (fetchError) throw fetchError

      // Add to conversations if not already there
      setConversations(prev => {
        if (prev.some(c => c.id === conversation.id)) {
          return prev
        }
        return [conversation, ...prev]
      })

      return conversation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation')
      throw err
    }
  }, [])

  // Get or create event group chat
  const getEventGroupChat = useCallback(async (eventId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user is attending the event
      const { data: attendee, error: attendeeError } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

      if (attendeeError || !attendee) {
        throw new Error('You must be attending the event to access the chat')
      }

      // Call the database function to get or create event group chat
      const { data: conversationId, error } = await supabase
        .rpc('create_event_group_chat', {
          p_event_id: eventId
        })

      if (error) throw error

      // Fetch the full conversation details
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            user_id,
            profile:profiles(id, username, full_name, avatar_url)
          ),
          event:events(id, title, starts_at, ends_at)
        `)
        .eq('id', conversationId)
        .single()

      if (fetchError) throw fetchError

      // Add to conversations if not already there
      setConversations(prev => {
        if (prev.some(c => c.id === conversation.id)) {
          return prev
        }
        return [conversation, ...prev]
      })

      return conversation
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
