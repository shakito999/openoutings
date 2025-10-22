'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { findPotentialMatches } from '@/lib/buddyMatching'
import { PotentialMatch, BuddyMatchWithProfiles, UserForMatching } from '@/lib/types/buddyMatching'

export default function BuddyMatchesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [events, setEvents] = useState<any[]>([])
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([])
  const [myMatches, setMyMatches] = useState<BuddyMatchWithProfiles[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (userId) {
      fetchUserEvents()
      fetchMyMatches()
    }
  }, [userId])

  useEffect(() => {
    if (selectedEventId && userId) {
      fetchPotentialMatches()
    }
  }, [selectedEventId, userId])

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session error:', error)
        router.push('/login')
        return
      }

      if (!session?.user) {
        router.push('/login')
        return
      }

      setUserId(session.user.id)
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserEvents = async () => {
    if (!userId) return

    try {
      // Get events user is attending
      const { data: attendances } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', userId)

      if (!attendances || attendances.length === 0) {
        setEvents([])
        return
      }

      const eventIds = attendances.map((a) => a.event_id)

      // Get event details
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, starts_at')
        .in('id', eventIds)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })

      setEvents(eventsData || [])

      // Auto-select first event if available
      if (eventsData && eventsData.length > 0 && !selectedEventId) {
        setSelectedEventId(eventsData[0].id.toString())
      }
    } catch (error) {
      console.error('Failed to fetch events:', error)
    }
  }

  const fetchPotentialMatches = async () => {
    if (!selectedEventId || !userId) return

    try {
      // Get all attendees for this event
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', selectedEventId)

      if (!attendees || attendees.length === 0) {
        setPotentialMatches([])
        return
      }

      const attendeeIds = attendees.map((a) => a.user_id)
      const otherAttendeeIds = attendeeIds.filter(id => id !== userId)

      if (otherAttendeeIds.length === 0) {
        setPotentialMatches([])
        return
      }

      // Get current user's profile, age, interests, and preferences
      const { data: currentUserData } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, gender')
.eq('id', userId)
        .single()

      if (!currentUserData) return

      // Get current user's age
      const { data: currentUserAgeData } = await supabase
        .from('user_age')
        .select('birth_year')
        .eq('user_id', userId)

      const currentAge = currentUserAgeData && currentUserAgeData.length > 0 && currentUserAgeData[0]?.birth_year
        ? new Date().getFullYear() - currentUserAgeData[0].birth_year
        : null

      // Get current user's interests
      const { data: currentUserInterests } = await supabase
        .from('user_interests')
        .select('interest')
        .eq('user_id', userId)

      const currentInterests = currentUserInterests?.map((i) => i.interest) || []

      // Get current user's preferences
      const { data: currentUserPreferencesData } = await supabase
        .from('buddy_preferences')
        .select('*')
        .eq('user_id', userId)

      const currentUserPreferences = currentUserPreferencesData && currentUserPreferencesData.length > 0 ? currentUserPreferencesData[0] : null

      const currentUser: UserForMatching = {
        id: currentUserData.id,
        name: currentUserData.name,
        avatar_url: currentUserData.avatar_url,
        gender: currentUserData.gender,
        age: currentAge,
        interests: currentInterests,
        preferences: currentUserPreferences || null,
      }

      // Get all attendees' profiles, ages, interests, and preferences
      const { data: attendeeProfiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, gender')
        .in('id', otherAttendeeIds)

      if (!attendeeProfiles || attendeeProfiles.length === 0) {
        setPotentialMatches([])
        return
      }

      // Fetch ages, interests, and preferences for other attendees
      const { data: ages } = await supabase
        .from('user_age')
        .select('user_id, birth_year')
        .in('user_id', otherAttendeeIds)

      const { data: interests } = await supabase
        .from('user_interests')
        .select('user_id, interest')
        .in('user_id', otherAttendeeIds)

      const { data: preferences } = await supabase
        .from('buddy_preferences')
        .select('*')
        .in('user_id', otherAttendeeIds)

      // Build UserForMatching objects
      const ageMap = new Map(ages?.map((a) => [a.user_id, a.birth_year]))
      const interestsMap = new Map<string, string[]>()
      interests?.forEach((i) => {
        const existing = interestsMap.get(i.user_id) || []
        interestsMap.set(i.user_id, [...existing, i.interest])
      })
      const preferencesMap = new Map(preferences?.map((p) => [p.user_id, p]))

      const allUsers: UserForMatching[] = attendeeProfiles.map((profile) => ({
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        gender: profile.gender,
        age: ageMap.get(profile.id)
          ? new Date().getFullYear() - ageMap.get(profile.id)!
          : null,
        interests: interestsMap.get(profile.id) || [],
        preferences: preferencesMap.get(profile.id) || null,
      }))

      // Filter out users who already have matches with current user
      const { data: existingMatches } = await supabase
        .from('buddy_matches')
        .select('user_id_1, user_id_2')
        .eq('event_id', selectedEventId)
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)

      const matchedUserIds = new Set(
        existingMatches?.flatMap((m) => [m.user_id_1, m.user_id_2]) || []
      )
      matchedUserIds.delete(userId)

      const availableUsers = allUsers.filter((u) => !matchedUserIds.has(u.id))

      // Find potential matches
      const potentialMatches = findPotentialMatches(currentUser, availableUsers)
      setPotentialMatches(potentialMatches)
    } catch (error) {
      console.error('Failed to fetch potential matches:', error)
    }
  }

  const fetchMyMatches = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/buddy-matches', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setMyMatches(data.matches || [])
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error)
    }
  }

  const handleSendMatchRequest = async (targetUserId: string, score: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/buddy-matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          targetUserId,
          compatibilityScore: score,
        }),
      })

      if (response.ok) {
        alert('Match request sent!')
        fetchPotentialMatches()
        fetchMyMatches()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to send match request')
      }
    } catch (error) {
      console.error('Failed to send match request:', error)
      alert('Failed to send match request')
    }
  }

  const handleAcceptMatch = async (matchId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/buddy-matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'accept' }),
      })

      if (response.ok) {
        alert('Match accepted!')
        fetchMyMatches()
      }
    } catch (error) {
      console.error('Failed to accept match:', error)
    }
  }

  const handleDeclineMatch = async (matchId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/buddy-matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'decline' }),
      })

      if (response.ok) {
        alert('Match declined')
        fetchMyMatches()
      }
    } catch (error) {
      console.error('Failed to decline match:', error)
    }
  }

  const handleCancelMatch = async (matchId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/buddy-matches/${matchId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        alert('Match cancelled')
        fetchMyMatches()
      }
    } catch (error) {
      console.error('Failed to cancel match:', error)
    }
  }

  const getMatchPartner = (match: BuddyMatchWithProfiles) => {
    if (!userId) return null
    return match.user_id_1 === userId ? match.user_2_profile : match.user_1_profile
  }

  const isMatchPending = (match: BuddyMatchWithProfiles) => {
    if (!userId) return false
    const isUser1 = match.user_id_1 === userId
    return isUser1 ? !match.user_2_accepted : !match.user_1_accepted
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">Loading buddy matches...</p>
        </div>
      </div>
    )
  }

  const pendingMatches = myMatches.filter((m) => m.status === 'pending')
  const acceptedMatches = myMatches.filter((m) => m.status === 'accepted')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Find Your Buddy
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Connect with people at your favorite events</p>
            </div>
            <Link
              href="/buddy-preferences"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Preferences
            </Link>
          </div>
        </div>

        {/* Event Selector */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Select Event
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select an event --</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} - {new Date(event.starts_at).toLocaleDateString()}
              </option>
            ))}
          </select>
          {events.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              You need to attend an event to find buddies
            </p>
          )}
        </div>

        {/* Pending Matches */}
        {pendingMatches.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">⏳ Pending Matches</h2>
            <div className="space-y-4">
              {pendingMatches.map((match) => {
                const partner = getMatchPartner(match)
                const waitingForResponse = isMatchPending(match)

                return (
                  <div key={match.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {partner?.avatar_url ? (
                          <img
                            src={partner.avatar_url}
                            alt={partner.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {partner?.name?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{partner?.name}</h3>
                          {match.compatibility_score && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {Math.round(match.compatibility_score)}% compatible
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {waitingForResponse ? (
                          <span className="text-sm text-gray-500 dark:text-gray-400">⏳ Waiting for response...</span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAcceptMatch(match.id)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleDeclineMatch(match.id)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Accepted Matches */}
        {acceptedMatches.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">✓ Your Buddies</h2>
            <div className="space-y-4">
              {acceptedMatches.map((match) => {
                const partner = getMatchPartner(match)

                return (
                  <div key={match.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-900/30 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {partner?.avatar_url ? (
                          <img
                            src={partner.avatar_url}
                            alt={partner.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-green-200 dark:border-green-900/30"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {partner?.name?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{partner?.name}</h3>
                          <span className="text-sm text-green-600 dark:text-green-400">✓ Confirmed Buddy</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelMatch(match.id)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Potential Matches */}
        {selectedEventId && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">💡 Suggested Matches</h2>
            {potentialMatches.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No matches found yet</h3>
                <p className="text-gray-600 dark:text-gray-400">More people might join this event soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {potentialMatches.map((match) => (
                  <div key={match.user.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
                    <div className="flex items-center space-x-4 mb-4">
                      {match.user.avatar_url ? (
                        <img
                          src={match.user.avatar_url}
                          alt={match.user.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-200 dark:border-blue-900/30"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                          {match.user.name?.[0] || 'U'}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{match.user.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" style={{ width: `${Math.min(match.compatibility_score, 100) * 0.6}px` }} />
                          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {Math.round(match.compatibility_score)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      {match.reasons.map((reason, idx) => (
                        <p key={idx} className="text-sm text-gray-700 dark:text-gray-300 mb-1 last:mb-0">
                          • {reason}
                        </p>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSendMatchRequest(match.user.id, match.compatibility_score)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-medium"
                    >
                      Send Match Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
