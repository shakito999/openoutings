"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import Link from 'next/link'

const slotInfo = {
  morning: { icon: '🌅', label: 'Morning', time: '6am-12pm' },
  noon: { icon: '☀️', label: 'Noon', time: '12pm-2pm' },
  afternoon: { icon: '🌤️', label: 'Afternoon', time: '2pm-6pm' },
  evening: { icon: '🌙', label: 'Evening', time: '6pm-12am' }
}

export default function PollPage() {
  const params = useParams()
  const router = useRouter()
  const pollSlug = params.id as string

  const [poll, setPoll] = useState<any>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userVotes, setUserVotes] = useState<Record<number, number>>({})
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'vote' | 'results'>('vote')

  useEffect(() => {
    loadPoll()
  }, [pollSlug])

  async function loadPoll() {
    setLoading(true)
    
    // Fetch poll
    const { data: pollData, error: pollError } = await supabase
      .from('availability_polls')
      .select('*')
      .eq('slug', pollSlug)
      .single()

    if (pollError || !pollData) {
      alert('Poll not found')
      router.push('/events')
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
    const { data: votesData } = await supabase
      .from('poll_votes')
      .select('*, poll_slots(on_date, slot)')
      .in('slot_id', (slotsData || []).map((s: any) => s.id))

    setVotes(votesData || [])
    setLoading(false)
  }

  async function submitVotes() {
    if (!userName.trim()) {
      alert('Please enter your name')
      return
    }

    setSaving(true)

    try {
      // Create or get user profile
      let userId = localStorage.getItem(`poll_user_${pollSlug}`)
      
      if (!userId) {
        // Create anonymous user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: `poll-${pollSlug}-${Date.now()}@temp.openoutings.com`,
          password: Math.random().toString(36),
        })
        
        if (authError) throw authError
        userId = authData.user?.id || null
        
        if (userId) {
          // Create profile
          await supabase.from('profiles').upsert({
            id: userId,
            username: userName,
            full_name: userName
          })
          
          localStorage.setItem(`poll_user_${pollSlug}`, userId)
        }
      }

      if (!userId) {
        alert('Failed to create user session')
        setSaving(false)
        return
      }

      // Delete existing votes
      await supabase
        .from('poll_votes')
        .delete()
        .eq('user_id', userId)

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

      alert('Your availability has been saved!')
      loadPoll()
      setViewMode('results')
    } catch (error: any) {
      alert('Error saving votes: ' + error.message)
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

  function getVoteCount(slotId: number) {
    return votes.filter(v => v.slot_id === slotId && v.preference === 1).length
  }

  function getMaybeCount(slotId: number) {
    return votes.filter(v => v.slot_id === slotId && v.preference === 0).length
  }

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.on_date]) acc[slot.on_date] = []
    acc[slot.on_date].push(slot)
    return acc
  }, {} as Record<string, any[]>)

  const dates = Object.keys(slotsByDate).sort()

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
          <Link href="/events" className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block">
            ← Back to Events
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {poll?.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(parseISO(poll?.starts_on), 'MMM d')} - {format(parseISO(poll?.ends_on), 'MMM d, yyyy')}
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
                  Click once for ✅ Available, twice for ❌ Not Available, three times to reset
                </p>

                <div className="space-y-6">
                  {dates.map(date => (
                    <div key={date}>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {format(parseISO(date), 'EEEE, MMMM d')}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {slotsByDate[date].map((slot: any) => {
                          const userVote = userVotes[slot.id] || 0
                          const info = slotInfo[slot.slot as keyof typeof slotInfo]
                          
                          return (
                            <button
                              key={slot.id}
                              onClick={() => toggleVote(slot.id)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                userVote === 1
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : userVote === -1
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                              }`}
                            >
                              <div className="text-2xl mb-1">{info.icon}</div>
                              <div className="font-medium text-gray-900 dark:text-white text-sm">
                                {info.label}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {info.time}
                              </div>
                              {userVote !== 0 && (
                                <div className="mt-2 text-lg">
                                  {userVote === 1 ? '✅' : '❌'}
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Availability Results
              </h2>

              <div className="space-y-6">
                {dates.map(date => (
                  <div key={date}>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {format(parseISO(date), 'EEEE, MMMM d')}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {slotsByDate[date].map((slot: any) => {
                        const available = getVoteCount(slot.id)
                        const maybe = getMaybeCount(slot.id)
                        const info = slotInfo[slot.slot as keyof typeof slotInfo]
                        const total = votes.length > 0 ? Math.max(...votes.map(v => votes.filter(vv => vv.user_id === v.user_id).length)) : 0
                        const percentage = total > 0 ? (available / total) * 100 : 0
                        
                        return (
                          <div
                            key={slot.id}
                            className={`p-4 rounded-lg border-2 ${
                              percentage >= 75
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : percentage >= 50
                                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            <div className="text-2xl mb-1">{info.icon}</div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {info.label}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {info.time}
                            </div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {available} ✅
                            </div>
                            {percentage >= 75 && (
                              <div className="mt-1 text-xs font-semibold text-green-600 dark:text-green-400">
                                🎉 Best time!
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
