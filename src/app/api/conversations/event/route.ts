import { createServerSupabase } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is part of the event
    const { data: attendee, error: attendeeError } = await supabase
      .from('event_attendees')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single()

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { error: 'You must be part of the event to access its chat' },
        { status: 403 }
      )
    }

    // Call the database function to get or create event group chat
    const { data, error } = await supabase
      .rpc('create_event_group_chat', {
        p_event_id: eventId
      })

    if (error) {
      console.error('Error creating event chat:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Fetch the full conversation details
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants(
          user_id,
          profile:profiles(id, username, full_name, avatar_url)
        ),
        event:events(id, title, starts_at, ends_at)
      `)
      .eq('id', data)
      .single()

    if (fetchError) {
      console.error('Error fetching conversation:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
