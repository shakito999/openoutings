"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import Toast from '@/components/Toast'

const slotInfo = {
  morning: { icon: '🌅', label: 'Morning', time: '6am-12pm' },
  noon: { icon: '☀️', label: 'Noon', time: '12pm-2pm' },
  afternoon: { icon: '🌤️', label: 'Afternoon', time: '2pm-6pm' },
  evening: { icon: '🌙', label: 'Evening', time: '6pm-12am' }
}

export default function PollPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [pollSlug, setPollSlug] = useState<string>('')
  const [poll, setPoll] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userVotes, setUserVotes] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'vote' | 'results'>('vote')
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    params.then(p => {
      setPollSlug(p.id)
      loadPoll(p.id)
    })
    
    // Load current user and auto-fill name
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user)
        // Fetch user profile to get full name
        supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUserName(profile.full_name || profile.username || '')
            }
          })
      }
    })
  }, [])

  async function loadPoll(slug: string) {
    setLoading(true)
    
    // Fetch poll
    const { data: pollData, error: pollError } = await supabase
      .from('availability_polls')
      .select('*')
      .eq('slug', slug)
      .single()

    if (pollError || !pollData) {
      setToast({ message: 'Poll not found', type: 'error' })
      setTimeout(() => router.push('/events'), 2000)
      return
    }

    setPoll(pollData)

    // Fetch slots
    const { data: slotsData } = await supabase
      .from('poll_slots')
      .select('*')
      .eq('poll_id', pollData.id)
      .order('on_date')
      .order('slot')

    setSlots(slotsData || [])

    // Fetch all votes
    if (slotsData && slotsData.length > 0) {
      const { data: votesData } = await supabase
        .from('poll_votes')
        .select('*')
        .in('slot_id', slotsData.map((s: any) => s.id))

      setVotes(votesData || [])
    }
    
    setLoading(false)
  }

  async function deletePoll() {
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('availability_polls')
        .delete()
        .eq('id', poll.id)

      if (error) throw error

      setToast({ message: 'Poll deleted successfully', type: 'success' })
      setTimeout(() => router.push('/profile/' + currentUser?.id), 2000)
    } catch (error: any) {
      setToast({ message: 'Error deleting poll: ' + error.message, type: 'error' })
    }
  }

  async function submitVotes() {
    if (!userName.trim()) {
      setToast({ message: 'Please enter your name', type: 'error' })
      return
    }

    setSaving(true)

    try {
      // Check if user already voted
      let userId = localStorage.getItem(`poll_user_${pollSlug}`)
      
      if (!userId) {
        // Get current user if logged in
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id || null
        
        if (userId) {
          localStorage.setItem(`poll_user_${pollSlug}`, userId)
        }
      }

      if (!userId) {
        setToast({ message: 'Please log in to vote on polls', type: 'error' })
        setSaving(false)
        return
      }

      // Delete existing votes for this user
      await supabase
        .from('poll_votes')
        .delete()
        .eq('user_id', userId)
        .in('slot_id', slots.map(s => s.id))

      // Insert new votes
      const voteInserts = Object.entries(userVotes)
        .filter(([_, pref]) => pref !== 0)
        .map(([slotId, preference]) => ({
          slot_id: parseInt(slotId),
          user_id: userId,
          preference
        }))

      if (voteInserts.length > 0) {
        const { error: voteError } = await supabase
          .from('poll_votes')
          .insert(voteInserts)

        if (voteError) throw voteError
      }

      setToast({ message: 'Your availability has been saved!', type: 'success' })
      loadPoll(pollSlug)
      setViewMode('results')
    } catch (error: any) {
      setToast({ message: 'Error saving votes: ' + error.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  function toggleVote(slotId: number) {
    setUserVotes(prev => {
      const current = prev[slotId] || 0
      const next = current === 1 ? -1 : current === -1 ? 0 : 1
      return { ...prev, [slotId]: next }
    })
  }

  function toggleDay(date: string) {
    const dateSlots = slotsByDate[date]
    const allAvailable = dateSlots.every((slot: any) => userVotes[slot.id] === 1)
    const newVote = allAvailable ? 0 : 1
    
    setUserVotes(prev => {
      const updated = { ...prev }
      dateSlots.forEach((slot: any) => {
        updated[slot.id] = newVote
      })
      return updated
    })
  }

  function getDayStatus(date: string) {
    const dateSlots = slotsByDate[date]
    const allAvailable = dateSlots.every((slot: any) => userVotes[slot.id] === 1)
    const someAvailable = dateSlots.some((slot: any) => userVotes[slot.id] === 1)
    const allUnavailable = dateSlots.every((slot: any) => userVotes[slot.id] === -1)
    
    if (allAvailable) return 'available'
    if (allUnavailable) return 'unavailable'
    if (someAvailable) return 'partial'
    return 'none'
  }

  function getVoteCount(slotId: number) {
    return votes.filter(v => v.slot_id === slotId && v.preference === 1).length
  }

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.on_date]) acc[slot.on_date] = []
    acc[slot.on_date].push(slot)
    return acc
  }, {} as Record<string, any[]>)

  const dates = Object.keys(slotsByDate).sort()

  // Get unique voter count and participant details
  const uniqueVoters = new Set(votes.map(v => v.user_id)).size
  const [participants, setParticipants] = useState<any[]>([])

  async function loadParticipants() {
    const voterIds = [...new Set(votes.map(v => v.user_id))]
    if (voterIds.length === 0) return

    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', voterIds)

    setParticipants(data || [])
  }

  useEffect(() => {
    if (votes.length > 0) {
      loadParticipants()
    }
  }, [votes])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading poll...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/events" className="text-blue-600 dark:text-blue-400 hover:underline">
              ← Back to Events
            </Link>
            {currentUser && poll?.creator_id === currentUser.id && (
              <button
                onClick={deletePoll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Poll</span>
              </button>
            )}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {poll?.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {poll?.starts_on && poll?.ends_on && (
              <>
                {format(parseISO(poll.starts_on), 'MMM d')} - {format(parseISO(poll.ends_on), 'MMM d, yyyy')}
              </>
            )}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            {uniqueVoters} {uniqueVoters === 1 ? 'person has' : 'people have'} voted
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6 flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 w-fit">
          <button
            onClick={() => setViewMode('vote')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'vote'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            📝 Vote
          </button>
          <button
            onClick={() => setViewMode('results')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'results'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            📊 Results
          </button>
        </div>

        {viewMode === 'vote' ? (
          <>
            {/* Name Input */}
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your name"
                value={userName}
                onChange={e => setUserName(e.target.value)}
              />
            </div>

            {/* Voting Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Mark Your Availability
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Click days to mark full availability. Expand for time slot details.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {dates.map(date => {
                    const dayStatus = getDayStatus(date)
                    const isExpanded = expandedDates[date]
                    const dateSlots = slotsByDate[date]
                    
                    return (
                      <div key={date} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* Day Card - Click to toggle entire day */}
                        <button
                          onClick={() => toggleDay(date)}
                          className={`w-full p-3 transition-all border-2 rounded-t-lg ${
                            dayStatus === 'available'
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : dayStatus === 'unavailable'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : dayStatus === 'partial'
                              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                          }`}
                        >
                          <div className="text-3xl mb-2">
                            {dayStatus === 'available' ? '✅' : dayStatus === 'unavailable' ? '❌' : dayStatus === 'partial' ? '⚠️' : '📅'}
                          </div>
                          <div className="font-bold text-gray-900 dark:text-white text-lg">
                            {format(parseISO(date), 'EEE')}
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {format(parseISO(date), 'd')}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {format(parseISO(date), 'MMM')}
                          </div>
                        </button>
                        
                        {/* Expand Button */}
                        <button
                          onClick={() => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }))}
                          className="w-full py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700"
                        >
                          <svg
                            className={`w-4 h-4 mx-auto text-gray-600 dark:text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Time Slots - Expandable */}
                        {isExpanded && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700">
                            <div className="space-y-2">
                              {dateSlots.map((slot: any) => {
                                const userVote = userVotes[slot.id] || 0
                                const info = slotInfo[slot.slot as keyof typeof slotInfo]
                                
                                return (
                                  <button
                                    key={slot.id}
                                    onClick={() => toggleVote(slot.id)}
                                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                                      userVote === 1
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : userVote === -1
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">{info.icon}</span>
                                      <div className="text-left">
                                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                                          {info.label}
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                          {info.time}
                                        </div>
                                      </div>
                                    </div>
                                    {userVote !== 0 && (
                                      <div className="text-lg">
                                        {userVote === 1 ? '✅' : '❌'}
                                      </div>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={submitVotes}
                  disabled={saving || !userName.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit Availability
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Participants List */}
            {participants.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Participants ({participants.length})
                </h2>
                <div className="flex flex-wrap gap-3">
                  {participants.map((participant: any) => (
                    <div
                      key={participant.id}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      {participant.avatar_url ? (
                        <img
                          src={participant.avatar_url}
                          alt={participant.full_name || participant.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {(participant.full_name?.[0] || participant.username?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {participant.full_name || participant.username || 'Anonymous'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Availability Results
                </h2>

              <div className="space-y-6">
                {dates.map(date => {
                  const dateSlots = slotsByDate[date]
                  const bestSlot = dateSlots.reduce((best: any, slot: any) => {
                    const count = getVoteCount(slot.id)
                    return count > getVoteCount(best?.id || 0) ? slot : best
                  }, null)
                  
                  return (
                    <div key={date}>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {format(parseISO(date), 'EEEE, MMMM d')}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {dateSlots.map((slot: any) => {
                          const available = getVoteCount(slot.id)
                          const info = slotInfo[slot.slot as keyof typeof slotInfo]
                          const percentage = uniqueVoters > 0 ? (available / uniqueVoters) * 100 : 0
                          const isBestSlot = bestSlot?.id === slot.id && available > 0
                          
                          return (
                            <div
                              key={slot.id}
                              className={`p-4 rounded-lg border-2 relative ${
                                percentage >= 75
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : percentage >= 50
                                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {isBestSlot && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                  ⭐ Best
                                </div>
                              )}
                              <div className="text-2xl mb-1">{info.icon}</div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {info.label}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                {info.time}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                  {available} ✅
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {Math.round(percentage)}%
                                </div>
                              </div>
                              {/* Progress bar */}
                              <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    percentage >= 75
                                      ? 'bg-green-500'
                                      : percentage >= 50
                                      ? 'bg-yellow-500'
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          </>
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  )
}
