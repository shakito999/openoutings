import { createServerSupabase } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conversations with participants and last message
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participants:conversation_participants!inner(
          user_id,
          last_read_at,
          profile:profiles(id, username, full_name, avatar_url)
        ),
        event:events(id, title, starts_at, ends_at),
        messages(id, content, sender_id, created_at)
      `)
      .eq('participants.user_id', user.id)
      .order('last_message_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const userParticipant = conv.participants.find(
          (p: any) => p.user_id === user.id
        )
        
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .gt('created_at', userParticipant?.last_read_at || new Date(0).toISOString())

        return {
          ...conv,
          unread_count: count || 0,
          last_message: conv.messages?.[0] || null,
          messages: undefined // Remove messages array to reduce payload
        }
      })
    )

    return NextResponse.json({ conversations: conversationsWithUnread })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
