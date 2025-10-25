'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface EventPhotoGalleryProps {
  photos: { storage_path: string }[]
  eventTitle: string
  eventDate: string
}

export default function EventPhotoGallery({ photos, eventTitle, eventDate }: EventPhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  if (!photos || photos.length === 0) return null

  const goToNext = () => {
    setSelectedIndex((prev) => (prev + 1) % photos.length)
  }

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const swipeThreshold = 50
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (photos.length <= 1) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const halfWidth = rect.width / 2

    if (x < halfWidth) {
      goToPrevious()
    } else {
      goToNext()
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="relative h-96 rounded-xl overflow-hidden shadow-xl cursor-pointer group"
        onClick={handleImageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={photos[selectedIndex].storage_path}
          alt={eventTitle}
          fill
          sizes="100vw"
          className="object-cover select-none"
          draggable={false}
        />
        <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-full">
          <span className="text-sm font-medium">
            {eventDate}
          </span>
        </div>
        {photos.length > 1 && (
          <>
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-white">
                {selectedIndex + 1} / {photos.length}
              </span>
            </div>
            
            {/* Navigation Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {/* Scrollable Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`h-24 w-32 flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                selectedIndex === index 
                  ? 'ring-4 ring-blue-500 opacity-100' 
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={photo.storage_path}
                alt={`${eventTitle} - photo ${index + 1}`}
                width={128}
                height={96}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
