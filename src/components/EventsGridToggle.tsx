"use client"
import { useState } from 'react'

interface EventsGridToggleProps {
  onToggle: (twoColumns: boolean) => void
}

export default function EventsGridToggle({ onToggle }: EventsGridToggleProps) {
  const [twoColumnMobile, setTwoColumnMobile] = useState(true)

  const handleToggle = () => {
    const newState = !twoColumnMobile
    setTwoColumnMobile(newState)
    onToggle(newState)
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      title={twoColumnMobile ? "1 column" : "2 columns"}
    >
      {twoColumnMobile ? (
        // 2 Column Grid Icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2h-6a2 2 0 01-2-2V6z" />
        </svg>
      ) : (
        // 1 Column Grid Icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        </svg>
      )}
    </button>
  )
}