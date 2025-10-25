import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServerSupabase } from '@/lib/supabaseServer'
import ProfileHeader from '@/components/ProfileHeader'
import ReviewsDisplay from '@/components/ReviewsDisplay'
import ProfileEventsSection from '@/components/ProfileEventsSection'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()
  
  // Get current user from session (more reliable than getUser)
  const { data: { session } } = await supabase.auth.getSession()
  const currentUser = session?.user
  
  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      *,
      user_interests (
        interest_id,
        interests (
          name
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!profile) {
    // If it's the current user's profile and doesn't exist, redirect to edit
    if (currentUser?.id === id) {
      redirect('/profile/edit')
    }
    return notFound()
  }

  const isOwnProfile = currentUser?.id === id
  
  // Fetch user's hosted events (only upcoming)
  const { data: hostedEvents } = await supabase
    .from('events')
    .select('*, event_photos(storage_path), event_attendees(user_id)')
    .eq('host_id', id)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(6)

  // Fetch user's joined events (only upcoming)
  const { data: joinedEventData } = await supabase
    .from('event_attendees')
    .select('events!inner(*, event_photos(storage_path), event_attendees(user_id))')
    .eq('user_id', id)
    .gte('events.starts_at', new Date().toISOString())
    .limit(6)
  
  const joinedEvents = joinedEventData?.map(item => (item as any).events).filter(Boolean)

  // Fetch user's created polls
  const { data: createdPolls } = await supabase
    .from('availability_polls')
    .select('*')
    .eq('creator_id', id)
    .order('created_at', { ascending: false })
    .limit(6)

  const interests = profile.user_interests?.map((ui: any) => ui.interests.name) || []
  
  // Fetch suggested events based on user interests if they have no events
  const hasNoEvents = (!hostedEvents || hostedEvents.length === 0) && (!joinedEvents || joinedEvents.length === 0)
  let suggestedEvents = null
  
  if (hasNoEvents && interests.length > 0) {
    const { data } = await supabase
      .from('events')
      .select(`
        *,
        event_photos(storage_path),
        event_attendees(user_id),
        event_interests!inner(
          interest_id,
          interests!inner(name)
        )
      `)
      .in('event_interests.interests.name', interests)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(6)
    
    suggestedEvents = data
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <ProfileHeader
          profile={profile}
          profileId={id}
          currentUserId={currentUser?.id}
          isOwnProfile={isOwnProfile}
          interests={interests}
        />

        {/* Hosted Events */}
        {hostedEvents && hostedEvents.length > 0 && (
          <ProfileEventsSection title="Организирани събития" events={hostedEvents} />
        )}

        {/* Created Polls */}
        {createdPolls && createdPolls.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Създадени анкети
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdPolls.map((poll: any) => (
                <Link
                  key={poll.id}
                  href={`/polls/${poll.slug}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {poll.title}
                      </h3>
                      {poll.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                          {poll.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date(poll.created_at).toLocaleDateString('bg-BG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{poll.starts_on} - {poll.ends_on}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Joined Events */}
        {joinedEvents && joinedEvents.length > 0 && (
          <ProfileEventsSection title="Присъединени събития" events={joinedEvents} />
        )}

        {/* Suggested Events - shown when user has no events but has interests */}
        {hasNoEvents && suggestedEvents && suggestedEvents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Препоръчани събития за теб
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Базирани на твоите интереси
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestedEvents.map((event: any) => (
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
                      sizes="(max-width: 1024px) 50vw, 33vw"
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
        )}

        {/* Reviews Section */}
        <ReviewsDisplay profileId={id} currentUserId={currentUser?.id} />

        {/* Empty State - only shown when truly no events */}
        {hasNoEvents && (!suggestedEvents || suggestedEvents.length === 0) && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Няма събития
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isOwnProfile ? 'Създайте или се присъединете към събития' : 'Този потребител все още няма събития'}
            </p>
            {isOwnProfile && (
              <Link
                href="/events/new"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Създай събитие
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
