"use client"

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Lightweight per-conversation aggregation of message notifications
// - Coalesces multiple messages from the same conversation into a single OS notification using the `tag` option
// - Throttles updates to avoid spamming (min 8s between updates per conversation)
// - Skips notifications when the relevant chat is active and visible

type AggregatedEntry = {
  count: number
  lastPreview: string
  lastShownAt: number
  timeoutId: number | null
  notifRef?: Notification
}

type ConvMeta = {
  id: string
  type: 'direct' | 'event_group'
  displayName: string
}

export default function MessageNotificationManager() {
  const aggRef = useRef<Map<string, AggregatedEntry>>(new Map())
  const convMetaRef = useRef<Map<string, ConvMeta>>(new Map())
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted || !user) return
      userIdRef.current = user.id

      // Preload conversation display names for the user
      await preloadConversations()

      // Subscribe to new messages (use a dedicated channel)
      const channel = supabase
        .channel('message_notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, async (payload: any) => {
          const msg = payload.new as { id: string; conversation_id: string; sender_id: string; content: string; created_at: string }

          // Ignore own messages
          if (!userIdRef.current || msg.sender_id === userIdRef.current) return

          // If chat for this conversation is active and page visible, skip
          const activeConvId = (window as any).activeConversationId as string | undefined
          const isActive = document.visibilityState === 'visible' && activeConvId === msg.conversation_id
          if (isActive) return

          // Ensure we have display name cached
          if (!convMetaRef.current.has(msg.conversation_id)) {
            await fetchConversationMeta(msg.conversation_id)
          }

          const meta = convMetaRef.current.get(msg.conversation_id)
          const title = meta ? (meta.type === 'event_group' ? `${meta.displayName}` : `${meta.displayName}`) : 'New message'

          // Show/aggregate notification if permission granted
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            aggregateAndNotify(msg.conversation_id, title, msg.content)
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    init()

    return () => {
      mounted = false
    }
  }, [])

  function aggregateAndNotify(conversationId: string, title: string, latestBody: string) {
    const agg = aggRef.current
    const now = Date.now()
    const MIN_UPDATE_MS = 8000
    const MAX_WAIT_MS = 20000

    const entry = agg.get(conversationId) || { count: 0, lastPreview: '', lastShownAt: 0, timeoutId: null, notifRef: undefined }
    entry.count += 1
    entry.lastPreview = latestBody

    const show = () => {
      const count = entry.count
      const body = count === 1 ? latestBody : `${count} new messages` 

      try {
        // Replace existing notification by using the same tag
        const n = new Notification(title, {
          body,
          icon: '/icon.png',
          tag: `msg-${conversationId}`,
          silent: entry.lastShownAt > 0, // subsequent updates are silent
          renotify: false as any, // some browsers ignore here; added to hint
        } as any)

        n.onclick = () => {
          try {
            window.focus()
            const url = new URL(window.location.href)
            url.pathname = '/messages'
            url.searchParams.set('conversation', conversationId)
            window.location.href = url.toString()
            n.close()
          } catch {}
        }

        entry.notifRef = n
      } catch {}

      entry.lastShownAt = now
      entry.count = 0
      entry.timeoutId = null
      agg.set(conversationId, entry)
    }

    const due = now - entry.lastShownAt
    if (entry.lastShownAt === 0 || due >= MIN_UPDATE_MS) {
      show()
    } else {
      // throttle: schedule a consolidated update later (extend/replace timer)
      if (entry.timeoutId) {
        clearTimeout(entry.timeoutId)
      }
      entry.timeoutId = window.setTimeout(() => {
        show()
      }, Math.min(MAX_WAIT_MS, MIN_UPDATE_MS - due))
      agg.set(conversationId, entry)
    }
  }

  async function preloadConversations() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get conversations the user participates in with participant profiles and event title
      const { data: participantRows } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id)

      const convIds = (participantRows || []).map((r: any) => r.conversation_id)
      if (convIds.length === 0) return

      const { data: convs } = await supabase
        .from('conversations')
        .select(`id, type, event:events(id, title), participants:conversation_participants(user_id, profile:profiles(id, username, full_name))`)
        .in('id', convIds)

      const map = convMetaRef.current
      for (const c of (convs || [])) {
        map.set(c.id, { id: c.id, type: c.type, displayName: computeDisplayName(c, user.id) })
      }
    } catch {}
  }

  async function fetchConversationMeta(convId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: conv } = await supabase
        .from('conversations')
        .select(`id, type, event:events(id, title), participants:conversation_participants(user_id, profile:profiles(id, username, full_name))`)
        .eq('id', convId)
        .single()
      if (conv) {
        convMetaRef.current.set(conv.id, { id: conv.id, type: conv.type, displayName: computeDisplayName(conv, user.id) })
      }
    } catch {}
  }

  function computeDisplayName(conv: any, selfId: string): string {
    if (conv.type === 'event_group') return conv.event?.title || 'Event Chat'
    const other = (conv.participants || []).find((p: any) => p.user_id !== selfId)
    return other?.profile?.full_name || other?.profile?.username || 'Direct chat'
  }

  return null
}
