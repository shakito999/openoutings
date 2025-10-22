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
      .select('id, full_name, username, avatar_url, gender, birth_date')
      .eq('id', user.id)

    const currentUserData = currentUserDataList && currentUserDataList.length > 0 ? currentUserDataList[0] : null
    if (currentUserError || !currentUserData) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Compute current user's age from birth_date
    const currentAge = (() => {
      const bd = currentUserData?.birth_date
      if (!bd) return null
      const dob = new Date(bd)
      if (isNaN(dob.getTime())) return null
      const today = new Date()
      let age = today.getFullYear() - dob.getFullYear()
      const m = today.getMonth() - dob.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
      return age
    })()

    // Get current user's interests
    const { data: currentUserInterests } = await supabase
      .from('user_interests')
      .select('interests(name)')
      .eq('user_id', user.id)

    const currentInterests = (currentUserInterests || [])
      .map((i: any) => i.interests?.name)
      .filter(Boolean)

    // Get current user's preferences
    const { data: currentUserPreferencesData } = await supabase
      .from('buddy_preferences')
      .select('*')
      .eq('user_id', user.id)

    const currentUserPreferences = currentUserPreferencesData && currentUserPreferencesData.length > 0 ? currentUserPreferencesData[0] : null

    const currentUser: UserForMatching = {
      id: currentUserData.id,
      name: currentUserData.full_name || currentUserData.username,
      avatar_url: currentUserData.avatar_url,
      gender: currentUserData.gender,
      age: currentAge,
      interests: currentInterests as string[],
      preferences: currentUserPreferences || null,
    }

    // Get all attendees' profiles, ages, interests, and preferences
    const { data: attendeeProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, gender, birth_date')
      .in('id', attendeeIds)
      .neq('id', user.id) // Exclude current user

    if (profilesError) {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    if (!attendeeProfiles || attendeeProfiles.length === 0) {
      return NextResponse.json({ matches: [] })
    }

    // Fetch interests and preferences for all attendees
    const { data: interests } = await supabase
      .from('user_interests')
      .select('user_id, interests(name)')
      .in('user_id', attendeeIds)

    const { data: preferences } = await supabase
      .from('buddy_preferences')
      .select('*')
      .in('user_id', attendeeIds)

    // Build UserForMatching objects
    const interestsMap = new Map<string, string[]>()
    ;(interests || []).forEach((i: any) => {
      const existing = interestsMap.get(i.user_id) || []
      const name = i.interests?.name
      if (name) interestsMap.set(i.user_id, [...existing, name])
    })
    const preferencesMap = new Map((preferences || []).map((p: any) => [p.user_id, p]))

    const allUsers: UserForMatching[] = (attendeeProfiles || []).map((profile: any) => {
      const bd = profile.birth_date
      let age: number | null = null
      if (bd) {
        const dob = new Date(bd)
        if (!isNaN(dob.getTime())) {
          const today = new Date()
          let a = today.getFullYear() - dob.getFullYear()
          const m = today.getMonth() - dob.getMonth()
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--
          age = a
        }
      }
      return {
        id: profile.id,
        name: profile.full_name || profile.username,
        avatar_url: profile.avatar_url,
        gender: profile.gender,
        age,
        interests: interestsMap.get(profile.id) || [],
        preferences: preferencesMap.get(profile.id) || null,
      }
    })

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
