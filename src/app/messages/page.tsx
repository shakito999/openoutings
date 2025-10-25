'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { useConversations } from '@/hooks/useConversations'
import { useMessages } from '@/hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'

export default function MessagesPage() {
  const router = useRouter()
  const { conversations, loading: conversationsLoading, refetch } = useConversations()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'convos' | 'people'>('convos')
  const [mutuals, setMutuals] = useState<any[]>([])
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPolicyTip, setShowPolicyTip] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  // Expose mobile sidebar opener for ChatArea header
  useEffect(() => {
    ;(window as any).openSidebar = () => setSidebarOpen(true)
    return () => {
      try { delete (window as any).openSidebar } catch {}
    }
  }, [])

  // Auto-select conversation from URL params (client-side)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const conversationParam = params.get('conversation')
    if (conversationParam && conversations.length > 0) {
      setSelectedConversationId(conversationParam)
    }
  }, [conversations])

  useEffect(() => {
    if (!userId) return
    loadMutuals()
  }, [userId])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUserId(user.id)
  }

  const loadMutuals = async () => {
    try {
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId)

      const { data: followers } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId)

      const followingSet = new Set((following || []).map((f: any) => f.following_id))
      const followerSet = new Set((followers || []).map((f: any) => f.follower_id))
      const mutualIds = [...followingSet].filter(id => followerSet.has(id))

      if (mutualIds.length === 0) {
        setMutuals([])
        return
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', mutualIds)

      setMutuals(profiles || [])
    } catch (e) {
      console.error('[messages] loadMutuals error:', e)
    }
  }

  const handleStartFromMutual = async (otherId: string) => {
    try {
      setMessagingUserId(otherId)
      const { data: convId, error } = await supabase
        .rpc('get_or_create_direct_conversation', { user_id_1: userId, user_id_2: otherId })
      if (error) throw error
      await refetch()
      setSelectedConversationId(convId as string)
      const url = new URL(window.location.href)
      url.searchParams.set('conversation', convId as string)
      window.history.replaceState({}, '', url.toString())
    } catch (e) {
      console.error('[messages] startFromMutual error:', e)
    } finally {
      setMessagingUserId(null)
    }
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId)

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (conversationsLoading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 md:py-12 md:px-6 px-0 py-0 flex flex-col">
      <div className="w-full md:max-w-7xl md:mx-auto flex-1 flex flex-col md:block">
        <div className="mb-4 hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Messages
            </h1>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPolicyTip((v) => !v)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                aria-label="Message retention policy"
                title="Message retention policy"
              >
                i
              </button>
              {showPolicyTip && (
                <div className="absolute z-10 mt-2 w-80 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Direct messages expire after 30 days. Event group chats disappear 5 days after the event ends.
                  </p>
                </div>
              )}
            </div>
          </div>
          <button
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open conversations"
          >
            <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="w-80 max-w-[85%] bg-white dark:bg-gray-800 shadow-2xl border-r border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Conversations</h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  className={`flex-1 py-2 text-sm font-medium ${tab === 'convos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setTab('convos')}
                >
                  Conversations
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium ${tab === 'people' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                  onClick={() => setTab('people')}
                >
                  People you can message
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {tab === 'convos' ? (
                  conversations.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">No conversations yet</div>
                  ) : (
                    conversations.map((conv) => {
                      const other = conv.participants.find(p => p.user_id !== userId)
                      const name = conv.type === 'event_group'
                        ? conv.event?.title || 'Event Chat'
                        : other?.profile?.full_name || other?.profile?.username || 'Unknown'
                      const avatar = conv.type === 'event_group' ? null : other?.profile?.avatar_url
                      return (
                        <button
                          key={conv.id}
                          onClick={() => { setSelectedConversationId(conv.id); setSidebarOpen(false) }}
                          className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${selectedConversationId === conv.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <Image src={avatar} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                                {(name?.[0] || 'C')}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{name}</h4>
                                {conv.type === 'event_group' && (
                                  <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">Event</span>
                                )}
                              </div>
                              {conv.last_message && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{conv.last_message.content}</p>
                              )}
                            </div>
                            {conv.unread_count > 0 && (
                              <div className="ml-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{conv.unread_count}</div>
                            )}
                          </div>
                        </button>
                      )
                    })
                  )
                ) : (
                  <div className="space-y-3">
                    {mutuals.length === 0 ? (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">No mutual follows yet</div>
                    ) : (
                      mutuals.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <div className="flex items-center gap-3">
                              {p.avatar_url ? (
                                <Image src={p.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">{(p.full_name?.[0] || p.username?.[0] || 'U')}</div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{p.full_name || p.username}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">@{p.username}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleStartFromMutual(p.id)}
                            disabled={messagingUserId === p.id}
                            className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                          >
                            {messagingUserId === p.id ? 'Starting...' : 'Message'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 md:gap-6 h-[calc(100dvh-64px)] md:h-[calc(100vh-280px)] md:pb-4">
          <div className="hidden md:flex col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex-col">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`flex-1 py-2 text-sm font-medium ${tab === 'convos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setTab('convos')}
              >
                Conversations
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium ${tab === 'people' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                onClick={() => setTab('people')}
              >
                People you can message
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {tab === 'convos' ? (
                conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">
                    <div>
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>No conversations yet</p>
                      <p className="text-sm mt-1">Start chatting with people you follow!</p>
                    </div>
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const otherParticipant = conv.participants.find(p => p.user_id !== userId)
                    const displayName = conv.type === 'event_group'
                      ? conv.event?.title || 'Event Chat'
                      : otherParticipant?.profile?.full_name || otherParticipant?.profile?.username || 'Unknown'
                    const avatar = conv.type === 'event_group' ? null : otherParticipant?.profile?.avatar_url

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversationId(conv.id)}
                        className={`w-full p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition ${
                          selectedConversationId === conv.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {avatar ? (
                            <Image src={avatar} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                              {(displayName?.[0] || 'C')}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h3>
                              {conv.type === 'event_group' && (
                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">Event</span>
                              )}
                            </div>
                            {conv.last_message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">{conv.last_message.content}</p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                            </p>
                          </div>
                          {conv.unread_count > 0 && (
                            <div className="ml-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{conv.unread_count}</div>
                          )}
                        </div>
                      </button>
                    )
                  })
                )
              ) : (
                <div className="p-4 space-y-3">
                  {mutuals.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">No mutual follows yet</div>
                  ) : (
                    mutuals.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-center gap-3">
                          {p.avatar_url ? (
                            <Image src={p.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">{(p.full_name?.[0] || p.username?.[0] || 'U')}</div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{p.full_name || p.username}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">@{p.username}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartFromMutual(p.id)}
                          disabled={messagingUserId === p.id}
                          className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                        >
                          {messagingUserId === p.id ? 'Starting...' : 'Message'}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-3 min-h-0 max-h-full overflow-hidden">
            {selectedConversation ? (
              <ChatArea conversation={selectedConversation} userId={userId} />
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full">
                {/* Mobile: show conversations list directly so user can pick one */}
                <div className="md:hidden flex flex-col h-full">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                      className={`flex-1 py-2 text-sm font-medium ${tab === 'convos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                      onClick={() => setTab('convos')}
                    >
                      Conversations
                    </button>
                    <button
                      className={`flex-1 py-2 text-sm font-medium ${tab === 'people' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                      onClick={() => setTab('people')}
                    >
                      People you can message
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {tab === 'convos' ? (
                      conversations.length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">No conversations yet</div>
                      ) : (
                        conversations.map((conv) => {
                          const other = conv.participants.find(p => p.user_id !== userId)
                          const name = conv.type === 'event_group'
                            ? conv.event?.title || 'Event Chat'
                            : other?.profile?.full_name || other?.profile?.username || 'Unknown'
                          const avatar = conv.type === 'event_group' ? null : other?.profile?.avatar_url
                          return (
                            <button
                              key={conv.id}
                              onClick={() => setSelectedConversationId(conv.id)}
                              className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${selectedConversationId === conv.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                {avatar ? (
                                  <Image src={avatar} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                                    {(name?.[0] || 'C')}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{name}</h4>
                                    {conv.type === 'event_group' && (
                                      <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">Event</span>
                                    )}
                                  </div>
                                  {conv.last_message && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">{conv.last_message.content}</p>
                                  )}
                                </div>
                                {conv.unread_count > 0 && (
                                  <div className="ml-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{conv.unread_count}</div>
                                )}
                              </div>
                            </button>
                          )
                        })
                      )
                    ) : (
                      <div className="space-y-3">
                        {mutuals.length === 0 ? (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">No mutual follows yet</div>
                        ) : (
                          mutuals.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <div className="flex items-center gap-3">
                                  {p.avatar_url ? (
                                    <Image src={p.avatar_url} alt="" width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                                  ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">{(p.full_name?.[0] || p.username?.[0] || 'U')}</div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{p.full_name || p.username}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">@{p.username}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => handleStartFromMutual(p.id)}
                                disabled={messagingUserId === p.id}
                                className="px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed"
                              >
                                {messagingUserId === p.id ? 'Starting...' : 'Message'}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Desktop placeholder */}
                <div className="hidden md:flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg">Select a conversation</p>
                    <p className="text-sm mt-1">to start messaging</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatArea({ conversation, userId }: { conversation: any; userId: string }) {
  const { messages, loading, hasMore, sendMessage, loadMore } = useMessages(conversation.id)
  const listRef = useRef<HTMLDivElement | null>(null)
  const stickToBottomRef = useRef(true)

  const scrollToBottom = () => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    stickToBottomRef.current = nearBottom
  }

  useEffect(() => {
    (window as any).activeConversationId = conversation.id
    return () => {
      try { if ((window as any).activeConversationId === conversation.id) { delete (window as any).activeConversationId } } catch {}
    }
  }, [conversation.id])

  useEffect(() => {
    // initial scroll
    const id = window.setTimeout(scrollToBottom, 0)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    // stick to bottom when new messages arrive and we were already near bottom
    if (stickToBottomRef.current) {
      const id = window.setTimeout(scrollToBottom, 0)
      return () => window.clearTimeout(id)
    }
  }, [messages.length])

  useEffect(() => {
    const onResize = () => {
      if (stickToBottomRef.current) scrollToBottom()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const EMOJIS = ['😀','😁','😂','😊','😍','😉','😎','😭','😅','🙏','👏','👍','🎉','❤️','🔥','✨']

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || sending) return

    setSending(true)
    try {
      await sendMessage(inputValue.trim())
      setInputValue('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const otherParticipant = conversation.participants.find((p: any) => p.user_id !== userId)
  const displayName = conversation.type === 'event_group' 
    ? conversation.event?.title || 'Event Chat'
    : otherParticipant?.profile?.full_name || otherParticipant?.profile?.username || 'Unknown'

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 md:rounded-xl md:shadow-lg md:border md:border-gray-200 md:dark:border-gray-700 h-full min-h-0" style={{ paddingBottom: 'var(--kb-offset, 0px)' }}>
      <div className="p-3 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            onClick={() => (window as any).openSidebar?.()}
            aria-label="Open conversations"
          >
            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {conversation.type === 'event_group' ? (
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center">🎉</div>
          ) : (
            otherParticipant?.profile?.avatar_url ? (
              <Image src={otherParticipant.profile.avatar_url} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                {(displayName?.[0] || 'U')}
              </div>
            )
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white flex-1 truncate">{displayName}</h2>
              <div className="relative">
                <button
                  type="button"
onClick={() => setShowInfo((v) => !v)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                  aria-label="Message retention policy"
                  title="Message retention policy"
                >
                  i
                </button>
                {showInfo && (
                  <div className="absolute right-0 z-10 mt-2 w-72 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      Direct messages expire after 30 days. Event group chats disappear 5 days after the event ends.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 md:p-6 space-y-4" ref={listRef} onScroll={handleScroll}>
        {hasMore && (
          <button
            onClick={loadMore}
            className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Load older messages
          </button>
        )}

        {loading && messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId
            const avatar = (msg as any).sender?.avatar_url as string | null
            const initials = ((msg as any).sender?.full_name?.[0] || (msg as any).sender?.username?.[0] || 'U')
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                {!isOwn && (
                  avatar ? (
                    <Image src={avatar} alt="" width={24} height={24} className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">{initials}</div>
                  )
                )}
                <div className={`max-w-[70%]`}>
                  {!isOwn && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-1">
                      {(msg as any).sender?.full_name || (msg as any).sender?.username || 'Unknown'}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                    }`}
                  >
                    <p className="break-words whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 opacity-70`}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {isOwn && (
                  avatar ? (
                    <Image src={avatar} alt="" width={24} height={24} className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-bold">{initials}</div>
                  )
                )}
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={handleSend} className="sticky bottom-0 p-3 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 text-xl"
            aria-label="Emoji picker"
          >
            😀
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => {
              // Scroll the form into view on mobile when keyboard opens
              setTimeout(() => {
                document.activeElement?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
              }, 300)
            }}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 disabled:shadow-none"
            aria-label="Send"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          {showEmoji && (
            <div className="absolute bottom-12 left-0 md:left-auto md:right-0 z-10 w-64 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-8 gap-2 text-xl">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className="hover:scale-110 transition"
                    onClick={() => { setInputValue((v) => v + e); setShowEmoji(false) }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
          {inputValue.length}/2000 characters
        </div>
      </form>
    </div>
  )
}
