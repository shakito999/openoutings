"use client"
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface ProfileEventsSectionProps {
  title: string
  events: any[]
}

export default function ProfileEventsSection({ title, events }: ProfileEventsSectionProps) {
  const [twoColumnMobile, setTwoColumnMobile] = useState(true)

  const gridClass = twoColumnMobile
    ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <button
          onClick={() => setTwoColumnMobile(v => !v)}
          className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={twoColumnMobile ? "1 column" : "2 columns"}
        >
          {twoColumnMobile ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2h-6a2 2 0 01-2-2V6z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
            </svg>
          )}
        </button>
      </div>

      <div className={gridClass}>
        {events.map((event: any) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
          >
            <div className="h-40 relative overflow-hidden">
              <Image
                src={event.event_photos?.[0]?.storage_path || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800'}
                alt={event.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {event.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date(event.starts_at).toLocaleDateString('bg-BG', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}