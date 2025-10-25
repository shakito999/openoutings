'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useConversations } from '@/hooks/useConversations'
import { useMessages } from '@/hooks/useMessages'
import { formatDistanceToNow } from 'date-fns'

export default function MessagesPage() {
  const router = useRouter()
  const { conversations, loading: conversationsLoading } = useConversations()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUserId(user.id)
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Chat with your connections</p>
        </div>

        <div className="mb-8 text-sm text-blue-700 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start">
            <span className="text-lg mr-3">💬</span>
            <div>
              <p className="font-semibold">Message Retention Policy</p>
              <p className="text-sm mt-1">We encourage real-life connections! Direct messages expire after 30 days, and event group chats disappear 5 days after the event ends. Keep the focus on meeting in person. 😊</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 h-[calc(100vh-280px)]">
          <div className="col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
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

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`w-full p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition ${
                        selectedConversationId === conv.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{displayName}</h3>
                            {conv.type === 'event_group' && (
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                                Event
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                              {conv.last_message.content}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <div className="ml-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            {conv.unread_count}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="col-span-3">
            {selectedConversation ? (
              <ChatArea conversation={selectedConversation} userId={userId} />
            ) : (
              <div className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-lg">Select a conversation</p>
                  <p className="text-sm mt-1">to start messaging</p>
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
  const [inputValue, setInputValue] = useState('')
  const [sending, setSending] = useState(false)

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
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white">{displayName}</h2>
        {conversation.type === 'event_group' && conversation.event && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            <span className="text-gray-600 dark:text-gray-400">Messages are deleted 5 days after the event ends</span>
            <div className="text-xs mt-1">
              Event: {new Date(conversation.event.starts_at).toLocaleDateString()}
            </div>
          </div>
        )}
        {conversation.type === 'direct' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Messages are deleted after 30 days
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
            return (
              <div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%]`}>
                  {!isOwn && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-1">
                      {msg.sender?.full_name || msg.sender?.username || 'Unknown'}
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
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={handleSend} className="p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-blue-500/30 disabled:shadow-none text-sm"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
          {inputValue.length}/2000 characters
        </div>
      </form>
    </div>
  )
}
