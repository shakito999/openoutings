"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { calculateDistance, getUserLocation } from '@/lib/distance'
import EventDistance from './EventDistance'

interface EventsWithDistanceProps {
  events: any[]
  twoColumnMobile?: boolean
}

export default function EventsWithDistance({ events, twoColumnMobile = false }: EventsWithDistanceProps) {
  const searchParams = useSearchParams()
  const distanceFilter = searchParams.get('distance')
  const [filteredEvents, setFilteredEvents] = useState(events)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    if (distanceFilter) {
      getUserLocation().then((location) => {
        setUserLocation(location)
        if (location) {
          const maxDistance = parseInt(distanceFilter)
          const filtered = events.filter((event) => {
            if (!event.lat || !event.lng) return true // Include events without location
            const distance = calculateDistance(
              location.latitude,
              location.longitude,
              event.lat,
              event.lng
            )
            return distance <= maxDistance
          })
          setFilteredEvents(filtered)
        } else {
          setFilteredEvents(events)
        }
      })
    } else {
      setFilteredEvents(events)
    }
  }, [distanceFilter, events])

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events found nearby</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your filters or distance range</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-6 ${
      twoColumnMobile ? 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }`}>
        {filteredEvents.map((e: any) => (
        <Link
          href={`/events/${e.id}`}
          key={e.id}
          className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
        >
          {/* Image */}
          <div className="h-32 sm:h-48 relative overflow-hidden">
            <img
              src={e.event_photos?.[0]?.storage_path || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800'}
              alt={e.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
              {new Date(e.starts_at).toLocaleDateString('bg-BG', { month: 'short', day: 'numeric' })}
            </div>
            {e.event_attendees && e.event_attendees.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {e.event_attendees.length}
              </div>
            )}
            <EventDistance eventLat={e.lat} eventLng={e.lng} />
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {e.title}
            </h2>

            {/* Time */}
            <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(e.starts_at).toLocaleString('en-US', {
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>

            {/* Location */}
            {e.address && (
              <div className="flex items-start text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="line-clamp-1 sm:line-clamp-2">{e.address}</span>
              </div>
            )}

            {/* Interests */}
            {e.event_interests && e.event_interests.length > 0 && (
              <div className="mb-2 sm:mb-3">
                <div className="flex flex-wrap gap-1">
                  {e.event_interests.slice(0, 2).map((ei: any) => (
                    <span
                      key={ei.interest_id}
                      className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                    >
                      {ei.interests?.name}
                    </span>
                  ))}
                  {e.event_interests.length > 2 && (
                    <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                      +{e.event_interests.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Capacity */}
            {e.capacity && (
              <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Capacity</span>
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{e.capacity}</span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
