import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'
import JoinEventButton from '@/components/JoinEventButton'
import AddToCalendarButton from '@/components/AddToCalendarButton'
import EventQRSection from '@/components/EventQRSection'
import CancelEventButton from '@/components/CancelEventButton'
import SimilarEvents from '@/components/SimilarEvents'
import EventPhotoGallery from '@/components/EventPhotoGallery'
import { formatRecurrencePattern } from '@/lib/recurringEvents'

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user || null
  
  // Fetch event with host profile, photos, and interests
  const { data: event } = await supabase
    .from('events')
    .select(`
      *,
      profiles:host_id (
        id,
        username,
        full_name,
        avatar_url
      ),
      event_photos (
        storage_path
      ),
      event_attendees (
        user_id
      )
    `)
    .eq('id', id)
    .single()
  
  // Fetch interests for this event
  let eventInterests: string[] = []
  if (event) {
    const { data: interestsData } = await supabase
      .from('event_interests')
      .select('interest_id, interests(name)')
      .eq('event_id', id)
    
    eventInterests = interestsData?.map((ei: any) => ei.interests.name).filter(Boolean) || []
  }

  if (!event) return notFound()

  const attendeeCount = event.event_attendees?.length || 0
  const spotsLeft = event.capacity ? event.capacity - attendeeCount : null
  const imageUrl = event.event_photos?.[0]?.storage_path || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800'
  const isHost = user?.id === event.host_id
  
  // Debug logging
  console.log('Event detail debug:', {
    userId: user?.id,
    hostId: event.host_id,
    isHost,
    hasUser: !!user
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/events"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Обратно към събития
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cancelled Badge */}
            {event.is_cancelled && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-600 p-6 rounded-lg mb-6">
                <div className="flex items-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-1">
                      СЪБИТИЕТО Е ОТМЕНЕНО
                    </h3>
                    <p className="text-red-700 dark:text-red-300">
                      Това събитие беше отменено на {new Date(event.cancelled_at).toLocaleDateString('bg-BG', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Gallery */}
            <EventPhotoGallery 
              photos={event.event_photos && event.event_photos.length > 0 
                ? event.event_photos 
                : [{ storage_path: imageUrl }]
              }
              eventTitle={event.title}
              eventDate={new Date(event.starts_at).toLocaleDateString('bg-BG', { 
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            />

            {/* Event Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {event.title}
              </h1>

              {/* Date & Time */}
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {new Date(event.starts_at).toLocaleString('bg-BG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {/* Recurring Event Info */}
              {event.is_recurring && event.recurrence_pattern !== 'none' && (
                <div className="flex items-start bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                  <svg className="w-5 h-5 mr-3 mt-0.5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      {formatRecurrencePattern(event.recurrence_pattern as any)}
                    </p>
                    {event.recurrence_end_date && (
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Until {new Date(event.recurrence_end_date).toLocaleDateString('bg-BG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              {event.address && (
                <div className="flex items-start text-gray-600 dark:text-gray-400 mb-6">
                  <svg className="w-5 h-5 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <a
                    href={event.lat && event.lng 
                      ? `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    {event.address}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Difficulty Level */}
              {event.difficulty && (
                <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {(event.difficulty === 'beginner' || event.difficulty === 'easy') && (
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          🟢
                        </div>
                      )}
                      {(event.difficulty === 'moderate' || event.difficulty === 'intermediate') && (
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          🟡
                        </div>
                      )}
                      {(event.difficulty === 'advanced' || event.difficulty === 'expert') && (
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          🔴
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Difficulty Level</h3>
                      <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                        {event.difficulty}
                        {event.difficulty === 'beginner' && ' - Anyone can join'}
                        {event.difficulty === 'easy' && ' - Minimal effort required'}
                        {event.difficulty === 'moderate' && ' - Some fitness needed'}
                        {event.difficulty === 'intermediate' && ' - Good fitness level'}
                        {event.difficulty === 'advanced' && ' - High fitness required'}
                        {event.difficulty === 'expert' && ' - Very demanding'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tips & Requirements */}
              {event.tips && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Tips & Requirements</h3>
                      <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                        {event.tips}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Interests */}
              {eventInterests.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Интереси</h3>
                  <div className="flex flex-wrap gap-2">
                    {eventInterests.map(interest => (
                      <span
                        key={interest}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600 dark:text-gray-400 text-sm">Участници</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {attendeeCount}{event.capacity && ` / ${event.capacity}`}
                  </span>
                </div>
                
                {spotsLeft !== null && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${(attendeeCount / event.capacity!) * 100}%` }}
                    />
                  </div>
                )}
                
                {spotsLeft !== null && spotsLeft > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {spotsLeft} {spotsLeft === 1 ? 'място' : 'места'} останаха
                  </p>
                )}
              </div>

              {!event.is_cancelled && <JoinEventButton eventId={event.id} />}
              {event.is_cancelled && (
                <div className="text-center py-4 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    Събитието е отменено
                  </p>
                </div>
              )}
              
              {!event.is_cancelled && (
                <div className="mt-4">
                  <AddToCalendarButton event={{
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    starts_at: event.starts_at,
                    address: event.address
                  }} />
                </div>
              )}
              
              {/* Cancel Button for Hosts */}
              {isHost && !event.is_cancelled && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <CancelEventButton 
                    eventId={event.id} 
                    eventTitle={event.title}
                    isCancelled={event.is_cancelled}
                  />
                </div>
              )}
            </div>

            {/* Check-in / QR Code Section */}
            <EventQRSection 
              eventId={event.id} 
              hostId={event.host_id!} 
            />

            {/* Host Card */}
            {event.profiles && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Организатор
                </h3>
                <Link
                  href={`/profile/${event.profiles.id}`}
                  className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded-lg transition-colors"
                >
                  {event.profiles.avatar_url ? (
                    <img
                      src={event.profiles.avatar_url}
                      alt={event.profiles.full_name || event.profiles.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {event.profiles.full_name?.[0] || event.profiles.username?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {event.profiles.full_name || event.profiles.username}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{event.profiles.username}
                    </p>
                  </div>
                </Link>
              </div>
            )}

            {/* Event Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Детайли
              </h3>
              
              <div className="space-y-3">
                {event.capacity && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Капацитет</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {event.capacity} човека
                    </span>
                  </div>
                )}
                
                {event.gender && event.gender !== 'none' && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Ограничение</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {event.gender}
                    </span>
                  </div>
                )}
                
                {event.is_paid && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Цена</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {event.price_cents ? `${(event.price_cents / 100).toFixed(2)} лв` : 'Платено'}
                    </span>
                  </div>
                )}
                
                {!event.is_paid && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Вход</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Безплатно</span>
                  </div>
                )}
                
                {event.is_recurring && event.recurrence_pattern !== 'none' && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Повтаря се</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {formatRecurrencePattern(event.recurrence_pattern as any)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Events Section */}
        <div className="mt-16">
          <SimilarEvents 
            currentEvent={{
              id: event.id,
              interests: eventInterests,
              lat: event.lat,
              lng: event.lng,
              starts_at: event.starts_at
            }}
          />
        </div>
      </div>
    </div>
  )
}
