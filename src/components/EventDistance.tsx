"use client"
import { useState, useEffect } from 'react'
import { calculateDistance, formatDistance, getUserLocation } from '@/lib/distance'

interface EventDistanceProps {
  eventLat: number | null
  eventLng: number | null
}

export default function EventDistance({ eventLat, eventLng }: EventDistanceProps) {
  const [distance, setDistance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventLat || !eventLng) {
      setLoading(false)
      return
    }

    getUserLocation().then((userLocation) => {
      if (userLocation) {
        const dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          eventLat,
          eventLng
        )
        setDistance(dist)
      }
      setLoading(false)
    })
  }, [eventLat, eventLng])

  if (loading || distance === null) {
    return null
  }

  return (
    <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center">
      <svg className="w-4 h-4 mr-1.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {formatDistance(distance)}
    </div>
  )
}
