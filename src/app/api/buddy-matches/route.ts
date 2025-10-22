import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST - Create a new buddy match request
export async function POST(request: NextRequest) {
  try {
    const { eventId, targetUserId, compatibilityScore } = await request.json()

    if (!eventId || !targetUserId) {
      return NextResponse.json(
        { error: 'Event ID and target user ID are required' },
        { status: 400 }
      )
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

    // Verify both users are attendees of the event
    const { data: attendees, error: attendeesError } = await supabase
      .from('event_attendees')
      .select('user_id')
      .eq('event_id', eventId)
      .in('user_id', [user.id, targetUserId])

    if (attendeesError || !attendees || attendees.length !== 2) {
      return NextResponse.json(
        { error: 'Both users must be attendees of the event' },
        { status: 400 }
      )
    }

    // Order user IDs to ensure consistency (required by DB constraint)
    const [userId1, userId2] = [user.id, targetUserId].sort()

    // Check if match already exists
    const { data: existingMatchList } = await supabase
      .from('buddy_matches')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id_1', userId1)
      .eq('user_id_2', userId2)

    if (existingMatchList && existingMatchList.length > 0) {
      return NextResponse.json(
        { error: 'Match request already exists' },
        { status: 409 }
      )
    }

    // Create the buddy match
    const { data: newMatch, error: insertError } = await supabase
      .from('buddy_matches')
      .insert({
        event_id: eventId,
        user_id_1: userId1,
        user_id_2: userId2,
        status: 'pending',
        compatibility_score: compatibilityScore || null,
        user_1_accepted: user.id === userId1,
        user_2_accepted: user.id === userId2,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating match:', insertError)
      return NextResponse.json(
        { error: 'Failed to create match' },
        { status: 500 }
      )
    }

    // Create notification for the other user
    const otherUserId = user.id === userId1 ? userId2 : userId1
    await supabase.from('notifications').insert({
      user_id: otherUserId,
      type: 'buddy_match_request',
      title: 'New buddy match request',
      message: `Someone wants to be your buddy at an event!`,
      related_event_id: eventId,
    })

    return NextResponse.json({ match: newMatch }, { status: 201 })
  } catch (error) {
    console.error('Error creating buddy match:', error)
    return NextResponse.json(
      { error: 'Failed to create buddy match' },
      { status: 500 }
    )
  }
}

// GET - Get buddy matches for current user (optionally filtered by event)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

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

    // Build query
    let query = supabase
      .from('buddy_matches')
      .select('*')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)

    if (eventId) {
      query = query.eq('event_id', eventId)
    }

    const { data: matches, error: matchesError } = await query.order('created_at', { ascending: false })

    if (matchesError) {
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      )
    }

    // Fetch profiles for all matched users
    const userIds = new Set<string>()
    matches?.forEach((match) => {
      userIds.add(match.user_id_1)
      userIds.add(match.user_id_2)
    })
    userIds.delete(user.id)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, gender')
      .in('id', Array.from(userIds))

    const profileMap = new Map(profiles?.map((p) => [p.id, p]))

    // Enrich matches with profile data
    const enrichedMatches = matches?.map((match) => ({
      ...match,
      user_1_profile: profileMap.get(match.user_id_1),
      user_2_profile: profileMap.get(match.user_id_2),
    }))

    return NextResponse.json({ matches: enrichedMatches })
  } catch (error) {
    console.error('Error fetching buddy matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buddy matches' },
      { status: 500 }
    )
  }
}
