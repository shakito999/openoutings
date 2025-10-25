"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useConversations } from '@/hooks/useConversations'
import FollowButton from '@/components/FollowButton'

export default function CommunityPage() {
  const router = useRouter()
  const { conversations } = useConversations()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [myEventIds, setMyEventIds] = useState<number[]>([])
  const [uniqueMembers, setUniqueMembers] = useState<any[]>([])
  const [myInterestIds, setMyInterestIds] = useState<number[]>([])
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null)
  const [followStatus, setFollowStatus] = useState<Map<string, { isFollowing: boolean, isFollower: boolean }>>(new Map())

  useEffect(() => {
    loadCommunityData()
  }, [])

  const handleMessage = async (recipientId: string) => {
    if (!userId) return
    setMessagingUserId(recipientId)

    try {
      // Call the database function directly from client
      const { data: conversationId, error } = await supabase
        .rpc('get_or_create_direct_conversation', {
          user_id_1: userId,
          user_id_2: recipientId
        })

      if (error) {
        throw error
      }

      router.push(`/messages?conversation=${conversationId}`)
    } catch (error: any) {
      console.error('Failed to start conversation:', error)
      if (error.message?.includes('follow each other')) {
        alert('You must follow each other to send messages.')
      } else {
        alert('Failed to start conversation. Please try again.')
      }
    } finally {
      setMessagingUserId(null)
    }
  }

  async function loadCommunityData() {
    setLoading(true)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    setUserId(user.id)

    // Get events the user has attended
    const { data: myAttendedEvents } = await supabase
      .from('event_attendees')
      .select('event_id')
      .eq('user_id', user.id)

    const eventIds = myAttendedEvents?.map(e => e.event_id) || []
    setMyEventIds(eventIds)

    if (eventIds.length === 0) {
      setLoading(false)
      return
    }

    // Get all attendees from those events (excluding current user)
    const { data: connections } = await supabase
      .from('event_attendees')
      .select(`
        user_id,
        event_id,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          bio
        )
      `)
      .in('event_id', eventIds)
      .neq('user_id', user.id)

    // Get interests of current user
    const { data: myInterests } = await supabase
      .from('user_interests')
      .select('interest_id, interests(id, name)')
      .eq('user_id', user.id)

    const interestIds = myInterests?.map(i => i.interest_id) || []
    setMyInterestIds(interestIds)

    // Group connections by user
    const userConnections = new Map<string, {
      profile: any
      sharedEvents: number[]
      mutualInterests: string[]
    }>()

    for (const conn of connections || []) {
      const connUserId = conn.user_id
      if (!userConnections.has(connUserId)) {
        userConnections.set(connUserId, {
          profile: conn.profiles,
          sharedEvents: [],
          mutualInterests: []
        })
      }
      userConnections.get(connUserId)!.sharedEvents.push(conn.event_id)
    }

    // Get interests for each connection
    for (const [connUserId, data] of userConnections) {
      const { data: theirInterests } = await supabase
        .from('user_interests')
        .select('interests(name)')
        .eq('user_id', connUserId)
        .in('interest_id', interestIds)

      data.mutualInterests = theirInterests?.map((i: any) => i.interests?.name).filter(Boolean) || []
    }

    // Convert to array and sort by shared events
    const communityMembers = Array.from(userConnections.values())
      .sort((a, b) => b.sharedEvents.length - a.sharedEvents.length)

    // Remove duplicates by profile ID
    const members = communityMembers.filter(
      (member, index, self) =>
        index === self.findIndex(m => m.profile?.id === member.profile?.id)
    )

    setUniqueMembers(members)
    
    // Load follow status for all members
    const userIds = members.map(m => m.profile.id).filter(Boolean)
    if (userIds.length > 0) {
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds)
      
      const { data: followers } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', user.id)
        .in('follower_id', userIds)
      
      const followingSet = new Set(following?.map(f => f.following_id) || [])
      const followerSet = new Set(followers?.map(f => f.follower_id) || [])
      
      const statusMap = new Map()
      for (const uid of userIds) {
        statusMap.set(uid, {
          isFollowing: followingSet.has(uid),
          isFollower: followerSet.has(uid)
        })
      }
      setFollowStatus(statusMap)
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading your community...</p>
        </div>
      </div>
    )
  }

  if (myEventIds.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
            My Community
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Your community starts here
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Attend events to meet amazing people and build your community. The more events you join, the more connections you'll make!
            </p>
            <Link
              href="/events"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Community
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            People you've met at {myEventIds.length} {myEventIds.length === 1 ? 'event' : 'events'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 md:grid-cols-3 md:gap-6 mb-6 md:mb-8">
          {[
            { label: 'Connections', value: uniqueMembers.length, bgClass: 'bg-blue-100 dark:bg-blue-900/30', textClass: 'text-blue-600 dark:text-blue-400', iconPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            { label: 'Events', value: myEventIds.length, bgClass: 'bg-purple-100 dark:bg-purple-900/30', textClass: 'text-purple-600 dark:text-purple-400', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { label: 'Interests', value: myInterestIds.length, bgClass: 'bg-green-100 dark:bg-green-900/30', textClass: 'text-green-600 dark:text-green-400', iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
          ].map(({ label, value, bgClass, textClass, iconPath }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
              <div className="flex items-center justify-between min-h-[64px]">
                <div>
                  <p className="text-[11px] md:text-sm text-gray-600 dark:text-gray-400 mb-1 whitespace-nowrap truncate" title={label}>{label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`w-10 h-10 md:w-12 md:h-12 ${bgClass} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-5 h-5 md:w-6 md:h-6 ${textClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Community Members */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Connections</h2>
          
          {uniqueMembers.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No connections yet. Keep attending events to meet more people!
            </p>
          ) : (
            <div className="space-y-4">
              {uniqueMembers.map((member) => {
                if (!member.profile) return null
                
                const status = followStatus.get(member.profile.id)
                const isMutualFollow = status?.isFollowing && status?.isFollower
                
                return (
                  <div
                    key={member.profile.id}
                    className="grid grid-cols-[64px_1fr_auto] gap-3 sm:gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 items-start"
                  >
                    <Link href={`/profile/${member.profile.id}`} className="flex-shrink-0">
                      {member.profile.avatar_url ? (
                        <img
                          src={member.profile.avatar_url}
                          alt={member.profile.full_name || member.profile.username}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold hover:shadow-lg transition-shadow">
                          {member.profile.full_name?.[0] || member.profile.username?.[0] || 'U'}
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="min-w-0">
                      <Link href={`/profile/${member.profile.id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {member.profile.full_name || member.profile.username}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        @{member.profile.username}
                      </p>
                      {member.profile.bio && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
                          {member.profile.bio}
                        </p>
                      )}

                      {/* Shared Details */}
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {member.sharedEvents.length} shared {member.sharedEvents.length === 1 ? 'event' : 'events'}
                        </span>
                        
                        {member.mutualInterests.length > 0 && (
                          <span className="inline-flex items-center px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {member.mutualInterests.length} mutual {member.mutualInterests.length === 1 ? 'interest' : 'interests'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col items-end gap-2">
                      <FollowButton compact userId={member.profile.id} currentUserId={userId || undefined} />
                      {isMutualFollow && (
                        <button
                          onClick={() => handleMessage(member.profile.id)}
                          disabled={messagingUserId === member.profile.id}
                          className="inline-flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full sm:rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium text-sm shadow-lg shadow-blue-500/30 disabled:shadow-none"
                          aria-label="Message"
                          title="Message"
                        >
                          {/* Message bubble icon */}
                          <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10a2 2 0 012 2v5a2 2 0 01-2 2H9l-4 4v-9a2 2 0 012-2z" />
                          </svg>
                          <span className="hidden sm:inline">{messagingUserId === member.profile.id ? 'Starting...' : 'Message'}</span>
                          <span className="sm:hidden">{messagingUserId === member.profile.id ? '...' : ''}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
