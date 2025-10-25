import { createServerSupabase } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // ISO timestamp for pagination

    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is part of the conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json(
        { error: 'You do not have access to this conversation' },
        { status: 403 }
      )
    }

    // Build query for messages
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Cursor-based pagination
    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update last_read_at for the user
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)

    return NextResponse.json({ 
      messages: messages?.reverse() || [], // Reverse to show oldest first
      hasMore: messages && messages.length === limit
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message is too long (max 2000 characters)' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Insert message (RLS will verify user is part of conversation)
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
