'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { calculateSimilarityScore, getSimilarityReason, type EventForScoring } from '@/lib/similarityScoring'

interface SimilarEventsProps {
  currentEvent: {
    id: number
    interests: string[]
    lat?: number | null
    lng?: number | null
    starts_at: string
  }
}

interface ScoredEvent {
  id: number
  title: string
  starts_at: string
  address: string | null
  lat: number | null
  lng: number | null
  capacity: number | null
  is_paid: boolean
  event_photos: Array<{ storage_path: string }>
  event_attendees: Array<{ user_id: string }>
  event_interests: Array<{ interests: Array<{ name: string }> }>
  profiles: {
    full_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
  score: number
  reason: string
}

export default function SimilarEvents({ currentEvent }: SimilarEventsProps) {
  const [similarEvents, setSimilarEvents] = useState<ScoredEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSimilarEvents() {
      try {
        // Fetch upcoming events (excluding current event and cancelled events)
        const { data: events, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            starts_at,
            address,
            lat,
            lng,
            capacity,
            is_paid,
            event_photos(storage_path),
            event_attendees(user_id),
            event_interests(interests(name)),
            profiles:host_id(full_name, username, avatar_url)
          `)
          .gte('starts_at', new Date().toISOString())
          .eq('is_cancelled', false)
          .neq('id', currentEvent.id)
          .limit(20)

        if (error) {
          console.error('Error fetching similar events:', error)
          setLoading(false)
          return
        }

        if (!events || events.length === 0) {
          setLoading(false)
          return
        }

        // Transform events to scoring format and calculate similarity scores
        const scoredEvents = events.map(event => {
          const eventInterests = event.event_interests
            ?.map((ei: any) => ei.interests?.name)
            .filter(Boolean) || []

          const eventForScoring: EventForScoring = {
            id: event.id,
            interests: eventInterests,
            lat: event.lat,
            lng: event.lng,
            starts_at: event.starts_at,
          }

          const score = calculateSimilarityScore(
            {
              id: currentEvent.id,
              interests: currentEvent.interests,
              lat: currentEvent.lat,
              lng: currentEvent.lng,
              starts_at: currentEvent.starts_at,
            },
            eventForScoring
          )

          const reason = getSimilarityReason(
            {
              id: currentEvent.id,
              interests: currentEvent.interests,
              lat: currentEvent.lat,
              lng: currentEvent.lng,
              starts_at: currentEvent.starts_at,
            },
            eventForScoring
          )

          return {
            id: event.id,
            title: event.title,
            starts_at: event.starts_at,
            address: event.address,
            lat: event.lat,
            lng: event.lng,
            capacity: event.capacity,
            is_paid: event.is_paid,
            event_photos: event.event_photos || [],
            event_attendees: event.event_attendees || [],
            event_interests: event.event_interests || [],
            profiles: Array.isArray(event.profiles) && event.profiles.length > 0 ? event.profiles[0] : null,
            score,
            reason,
          } as ScoredEvent
        })

        // Sort by score descending and take top 6
        const topEvents = scoredEvents
          .sort((a, b) => b.score - a.score)
          .slice(0, 6)
          .filter(e => e.score > 0) // Only show events with some similarity

        setSimilarEvents(topEvents)
      } catch (err) {
        console.error('Error in fetchSimilarEvents:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilarEvents()
  }, [currentEvent.id, currentEvent.interests, currentEvent.lat, currentEvent.lng, currentEvent.starts_at])

  if (loading) {
    return (
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Подобни събития 🎯
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-48 bg-gray-300 dark:bg-gray-700" />
              <div className="p-6 space-y-3">
                <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (similarEvents.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Подобни събития 🎯
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Събития, които може да ви харесат
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarEvents.map(event => {
          const attendeeCount = event.event_attendees?.length || 0
          const spotsLeft = event.capacity ? event.capacity - attendeeCount : null
          const imageUrl = event.event_photos?.[0]?.storage_path || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800'
          const eventInterests = event.event_interests
            ?.map((ei: any) => ei.interests?.name)
            .filter(Boolean) || []

          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
            >
              {/* Image */}
              <div className="h-48 relative overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={event.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                
                {/* Date Badge */}
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                  {new Date(event.starts_at).toLocaleDateString('bg-BG', { month: 'short', day: 'numeric' })}
                </div>

                {/* Similarity Reason */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-blue-600/90 dark:bg-blue-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs text-white font-medium line-clamp-1">
                    {event.reason}
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {event.title}
                </h3>
                
                {/* Time */}
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="line-clamp-1">
                    {new Date(event.starts_at).toLocaleString('bg-BG', {
                      weekday: 'short',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Location (if available) */}
                {event.address && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="line-clamp-1">{event.address}</span>
                  </div>
                )}

                {/* Shared Interests Tags */}
                {eventInterests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {eventInterests.slice(0, 3).map((interest: string) => (
                      <span
                        key={interest}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          currentEvent.interests.includes(interest)
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {interest}
                      </span>
                    ))}
                    {eventInterests.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                        +{eventInterests.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer - Attendees and Price */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {attendeeCount}
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <span className="ml-1">/ {event.capacity}</span>
                    )}
                  </div>
                  
                  <div className={`text-sm font-medium ${event.is_paid ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                    {event.is_paid ? 'Платено' : 'Безплатно'}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
