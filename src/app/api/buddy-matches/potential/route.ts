import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { findPotentialMatches } from '@/lib/buddyMatching'
import { UserForMatching } from '@/lib/types/buddyMatching'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Get the authenticated user's session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify event exists and get attendees
    const { data: eventList, error: eventError } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', eventId)

    const event = eventList && eventList.length > 0 ? eventList[0] : null
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get all attendees for this event
    const { data: attendees, error: attendeesError } = await supabase
      .from('event_attendees')
      .select('user_id')
      .eq('event_id', eventId)

    if (attendeesError) {
      return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 })
    }

    if (!attendees || attendees.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    const attendeeIds = attendees.map((a) => a.user_id)

    // Get current user's profile, age, interests, and preferences
    const { data: currentUserDataList, error: currentUserError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, gender')
      .eq('id', user.id)

    const currentUserData = currentUserDataList && currentUserDataList.length > 0 ? currentUserDataList[0] : null
    if (currentUserError || !currentUserData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get current user's age
    const { data: currentUserAgeData } = await supabase
      .from('user_age')
      .select('birth_year')
      .eq('user_id', user.id)

    const currentAge = currentUserAgeData && currentUserAgeData.length > 0 && currentUserAgeData[0]?.birth_year
      ? new Date().getFullYear() - currentUserAgeData[0].birth_year
      : null

    // Get current user's interests
    const { data: currentUserInterests } = await supabase
      .from('user_interests')
      .select('interest')
      .eq('user_id', user.id)

    const currentInterests = currentUserInterests?.map((i) => i.interest) || []

    // Get current user's preferences
    const { data: currentUserPreferencesData } = await supabase
      .from('buddy_preferences')
      .select('*')
      .eq('user_id', user.id)

    const currentUserPreferences = currentUserPreferencesData && currentUserPreferencesData.length > 0 ? currentUserPreferencesData[0] : null

    const currentUser: UserForMatching = {
      id: currentUserData.id,
      name: currentUserData.name,
      avatar_url: currentUserData.avatar_url,
      gender: currentUserData.gender,
      age: currentAge,
      interests: currentInterests,
      preferences: currentUserPreferences || null,
    }

    // Get all attendees' profiles, ages, interests, and preferences
    const { data: attendeeProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, gender')
      .in('id', attendeeIds)
      .neq('id', user.id) // Exclude current user

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!attendeeProfiles || attendeeProfiles.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // Fetch ages, interests, and preferences for all attendees
    const { data: ages } = await supabase
      .from('user_age')
      .select('user_id, birth_year')
      .in('user_id', attendeeIds)

    const { data: interests } = await supabase
      .from('user_interests')
      .select('user_id, interest')
      .in('user_id', attendeeIds)

    const { data: preferences } = await supabase
      .from('buddy_preferences')
      .select('*')
      .in('user_id', attendeeIds)

    // Build UserForMatching objects
    const ageMap = new Map(ages?.map((a) => [a.user_id, a.birth_year]))
    const interestsMap = new Map<string, string[]>()
    interests?.forEach((i) => {
      const existing = interestsMap.get(i.user_id) || []
      interestsMap.set(i.user_id, [...existing, i.interest])
    })
    const preferencesMap = new Map(preferences?.map((p) => [p.user_id, p]))

    const allUsers: UserForMatching[] = attendeeProfiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      avatar_url: profile.avatar_url,
      gender: profile.gender,
      age: ageMap.get(profile.id)
        ? new Date().getFullYear() - ageMap.get(profile.id)!
        : null,
      interests: interestsMap.get(profile.id) || [],
      preferences: preferencesMap.get(profile.id) || null,
    }))

    // Filter out users who already have matches with current user
    const { data: existingMatches } = await supabase
      .from('buddy_matches')
      .select('user_id_1, user_id_2')
      .eq('event_id', eventId)
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

    const matchedUserIds = new Set(
      existingMatches?.flatMap((m) => [m.user_id_1, m.user_id_2]) || []
    )
    matchedUserIds.delete(user.id) // Remove current user from set

    const availableUsers = allUsers.filter((u) => !matchedUserIds.has(u.id))

    // Find potential matches
    const potentialMatches = findPotentialMatches(currentUser, availableUsers)

    return NextResponse.json({ matches: potentialMatches })
  } catch (error) {
    console.error('Error finding potential matches:', error)
    return NextResponse.json(
      { error: 'Failed to find potential matches' },
      { status: 500 }
    )
  }
}
