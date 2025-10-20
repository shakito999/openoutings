"use client"
import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, formatISO, startOfToday, format, eachDayOfInterval } from 'date-fns'
import { supabase } from '@/lib/supabaseClient'
import Toast from '@/components/Toast'

const slots = [
  { value: 'morning', label: 'Morning', icon: '🌅', time: '6am-12pm' },
  { value: 'noon', label: 'Noon', icon: '☀️', time: '12pm-2pm' },
  { value: 'afternoon', label: 'Afternoon', icon: '🌤️', time: '2pm-6pm' },
  { value: 'evening', label: 'Evening', icon: '🌙', time: '6pm-12am' }
] as const

export default function NewPoll(){
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
    })
  }, [])

  const start = startOfToday()
  const end = useMemo(()=> addDays(start, days),[start, days])
  const previewDays = useMemo(() => eachDayOfInterval({ start, end }), [start, end])

  async function create(){
    if (!title) {
      setToast({ message: 'Please enter a title', type: 'error' })
      return
    }
    
    setLoading(true)
    const slug = Math.random().toString(36).slice(2,10)
    
    // Create poll
    const { data: pollData, error: pollError } = await supabase
      .from('availability_polls')
      .insert({
        title,
        starts_on: formatISO(start, { representation: 'date' }),
        ends_on: formatISO(end, { representation: 'date' }),
        slug,
        creator_id: userId
      })
      .select()
      .single()
    
    if (pollError) {
      setToast({ message: pollError.message, type: 'error' })
      setLoading(false)
      return
    }
    
    // Create time slots for each day and time period
    const daysArray = eachDayOfInterval({ start, end })
    const slotInserts = daysArray.flatMap(day => 
      slots.map(slot => ({
        poll_id: pollData.id,
        on_date: formatISO(day, { representation: 'date' }),
        slot: slot.value
      }))
    )
    
    const { error: slotsError } = await supabase
      .from('poll_slots')
      .insert(slotInserts)
    
    setLoading(false)
    
    if (slotsError) {
      setToast({ message: 'Poll created but slots failed: ' + slotsError.message, type: 'error' })
    } else {
      const link = `/polls/${slug}`
      setShareLink(link)
      setToast({ message: 'Poll created successfully!', type: 'success' })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create Availability Poll
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Find the best time for your group to meet</p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-8 space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Poll Title *
              </label>
              <input
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., Weekend Hiking Trip"
                value={title}
                onChange={e=>setTitle(e.target.value)}
              />
            </div>

            {/* Duration Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Poll Duration (days)
              </label>
              <input
                type="number"
                min={1}
                max={14}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={days}
                onChange={e=>setDays(Number(e.target.value))}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                From {format(start, 'MMM d, yyyy')} to {format(end, 'MMM d, yyyy')}
              </p>
            </div>

            {/* Time Slots Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Time Slots
              </label>
              <div className="grid grid-cols-2 gap-3">
                {slots.map(slot => (
                  <div key={slot.value} className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="text-2xl mb-1">{slot.icon}</div>
                    <div className="font-medium text-gray-900 dark:text-white">{slot.label}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{slot.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-2">Preview:</p>
                  <div className="bg-white dark:bg-gray-800 rounded p-2 text-blue-900 dark:text-blue-100">
                    <p><strong>{previewDays.length} days</strong> × <strong>4 time slots</strong> = <strong>{previewDays.length * 4} total slots</strong></p>
                  </div>
                  <p className="mt-2 text-blue-700 dark:text-blue-300">
                    Participants will mark their availability for each slot, and you'll see which times work best for everyone!
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={create}
                disabled={loading || !title}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Poll
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Share Link Card */}
        {shareLink && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                  Poll Created Successfully!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                  Share this link with participants:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100">
                    {shareLink}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + shareLink)
                      setToast({ message: 'Link copied to clipboard!', type: 'success' })
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Copy
                  </button>
                </div>
                <button
                  onClick={() => router.push(shareLink)}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  View Poll
                </button>
              </div>
            </div>
          </div>
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
