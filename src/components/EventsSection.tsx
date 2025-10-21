"use client"
import { useState } from 'react'
import EventsWithDistance from './EventsWithDistance'
import EventsGridToggle from './EventsGridToggle'

interface EventsSectionProps {
  events: any[]
  title: string
}

export default function EventsSection({ events, title }: EventsSectionProps) {
  const [twoColumnMobile, setTwoColumnMobile] = useState(true)

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <div className="md:hidden">
          <EventsGridToggle onToggle={setTwoColumnMobile} />
        </div>
      </div>
      <EventsWithDistance events={events} twoColumnMobile={twoColumnMobile} />
    </>
  )
}
