import Link from 'next/link'
import CompactFilters from '@/components/CompactFilters'
import EventsWithDistance from '@/components/EventsWithDistance'
import { createServerSupabase } from '@/lib/supabaseServer'

function getDateRange(timeFilter: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (timeFilter) {
    case 'today':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    case 'thisweek':
      const dayOfWeek = today.getDay()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 7)
      return { from: startOfWeek, to: endOfWeek }
    case 'weekend':
      const daysUntilSaturday = (6 - today.getDay() + 7) % 7
      const saturday = new Date(today)
      saturday.setDate(today.getDate() + daysUntilSaturday)
      const monday = new Date(saturday)
      monday.setDate(saturday.getDate() + 2)
      return { from: saturday, to: monday }
    case 'thismonth':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)
      return { from: startOfMonth, to: endOfMonth }
    case 'nextmonth':
      const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0, 23, 59, 59)
      return { from: startOfNextMonth, to: endOfNextMonth }
    default:
      return null
  }
}

export default async function EventsPage({ searchParams }:{ searchParams: Promise<Record<string,string>> }){
  const supabase = await createServerSupabase()
  const params = await searchParams
  const q = params.q ?? ''
  const timeFilter = params.time ?? ''
  const sortBy = params.sort ?? 'soonest'
  const distanceFilter = params.distance ?? ''
  const interestsFilter = params.interests?.split(',').filter(Boolean) || []
  
  // Get current user and events from people they follow
  const { data: { user } } = await supabase.auth.getUser()
  let followedUsersEvents: any[] = []
  
  if (user && !q && !timeFilter) {
    // Get people the user follows
    const { data: following } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id)
    
    if (following && following.length > 0) {
      const followingIds = following.map(f => f.following_id)
      
      // Get upcoming events from followed users (exclude cancelled)
      const { data: followedEvents } = await supabase
        .from('events')
        .select('*, event_photos(storage_path), event_attendees(user_id), profiles!events_host_id_fkey(full_name, username, avatar_url)')
        .in('host_id', followingIds)
        .gte('starts_at', new Date().toISOString())
        .eq('is_cancelled', false)
        .order('starts_at', { ascending: true })
        .limit(3)
      
      followedUsersEvents = followedEvents || []
    }
  }
  
  // If interests filter is applied, we need to get events through the event_interests table
  let eventIds: number[] | null = null
  if (interestsFilter.length > 0) {
    // First get the interest IDs from interest names
    const { data: interestData } = await supabase
      .from('interests')
      .select('id')
      .in('name', interestsFilter)
    
    if (interestData && interestData.length > 0) {
      const interestIds = interestData.map(i => i.id)
      
      // Get events that have ALL selected interests
      const { data: eventInterestData } = await supabase
        .from('event_interests')
        .select('event_id')
        .in('interest_id', interestIds)
      
      if (eventInterestData && eventInterestData.length > 0) {
        // Count occurrences of each event_id
        const eventCounts = eventInterestData.reduce((acc, ei) => {
          acc[ei.event_id] = (acc[ei.event_id] || 0) + 1
          return acc
        }, {} as Record<number, number>)
        
        // Filter to only events that have all selected interests
        eventIds = Object.entries(eventCounts)
          .filter(([_, count]) => count === interestIds.length)
          .map(([id]) => Number(id))
      } else {
        eventIds = [] // No events found with these interests
      }
    }
  }
  
  let query = supabase
    .from('events')
    .select(`
      *,
      event_photos(storage_path),
      event_attendees(user_id),
      lat,
      lng,
      event_interests(interest_id, interests(name))
    `)
    .eq('is_cancelled', false)
    .gte('starts_at', new Date().toISOString())
  
  // Apply interests filter
  if (eventIds !== null) {
    if (eventIds.length === 0) {
      // No events match the interest filter, return empty
      query = query.eq('id', -1) as any // This will return no results
    } else {
      query = query.in('id', eventIds) as any
    }
  }
  
  // Apply time filter
  const dateRange = getDateRange(timeFilter)
  if (dateRange) {
    query = query.gte('starts_at', dateRange.from.toISOString()) as any
    query = query.lt('starts_at', dateRange.to.toISOString()) as any
  }
  
  // Apply search
  if (q) query = query.ilike('title', `%${q}%`) as any

  // Apply sorting
  switch (sortBy) {
    case 'newest':
      query = query.order('created_at', { ascending: false }) as any
      break
    case 'popular':
      // Sort by number of attendees (handled client-side after fetch)
      break
    case 'spots':
      // Sort by available spots (handled client-side after fetch)
      break
    case 'soonest':
    default:
      query = query.order('starts_at', { ascending: true }) as any
      break
  }

  let { data: events } = await query

  // Client-side sorting for complex cases
  if (events && sortBy === 'popular') {
    events = events.sort((a, b) => {
      const aCount = a.event_attendees?.length || 0
      const bCount = b.event_attendees?.length || 0
      return bCount - aCount
    })
  } else if (events && sortBy === 'spots') {
    events = events.sort((a, b) => {
      const aSpotsLeft = a.capacity ? a.capacity - (a.event_attendees?.length || 0) : 0
      const bSpotsLeft = b.capacity ? b.capacity - (b.event_attendees?.length || 0) : 0
      return bSpotsLeft - aSpotsLeft
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Discover Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Find and join exciting activities in your area</p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <CompactFilters />
        </div>

        {/* Events from People You Follow */}
        {followedUsersEvents.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  👥 From People You Follow
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Events hosted by your connections
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {followedUsersEvents.map((e: any) => (
                <Link
                  key={e.id}
                  href={`/events/${e.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
                >
                  <div className="h-48 relative overflow-hidden">
                    <img
                      src={e.event_photos?.[0]?.storage_path || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800'}
                      alt={e.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    
                    {/* Host badge */}
                    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-3 py-2 rounded-full">
                      {e.profiles?.avatar_url ? (
                        <img
                          src={e.profiles.avatar_url}
                          alt={e.profiles.full_name || e.profiles.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {(e.profiles?.full_name?.[0] || e.profiles?.username?.[0] || 'U').toUpperCase()}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {e.profiles?.full_name || e.profiles?.username || 'Host'}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {new Date(e.starts_at).toLocaleDateString('bg-BG', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {e.title}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(e.starts_at).toLocaleString('en-US', {
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Events */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {followedUsersEvents.length > 0 ? 'All Events' : 'Events'}
          </h2>
        </div>

        {/* Events Grid */}
        {events && events.length > 0 ? (
          <EventsWithDistance events={events} />
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your filters or create a new event</p>
            <Link
              href="/events/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-blue-500/30"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
