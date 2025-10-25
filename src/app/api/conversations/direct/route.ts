import { createServerSupabase } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { otherUserId } = await request.json()

    if (!otherUserId) {
      return NextResponse.json({ error: 'otherUserId is required' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the database function to get or create conversation
    const { data, error } = await supabase
      .rpc('get_or_create_direct_conversation', {
        user_id_1: user.id,
        user_id_2: otherUserId
      })

    if (error) {
      console.error('Error creating conversation:', error)
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
        )
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
