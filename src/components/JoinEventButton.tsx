"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function JoinEventButton({ eventId }: { eventId: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkJoinStatus()
  }, [eventId])

  async function checkJoinStatus() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user) {
      const { data } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()
      
      setIsJoined(!!data)
    }
  }

  async function handleJoin() {
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    
    if (isJoined) {
      // Leave event
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id)
      
      if (!error) {
        setIsJoined(false)
        router.refresh()
      }
    } else {
      // Join event
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: user.id
        })
      
      if (!error) {
        setIsJoined(true)
        router.refresh()
      }
    }
    
    setLoading(false)
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className={`w-full px-6 py-3 rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
        isJoined
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-blue-500/30'
      }`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Зареждане...
        </span>
      ) : isJoined ? (
        'Напусни събитието'
      ) : (
        'Присъедини се'
      )}
    </button>
  )
}
