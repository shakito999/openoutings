import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// PATCH - Update match status (accept/decline)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { action } = await request.json() // 'accept' or 'decline'
    const { matchId } = await params

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "decline"' },
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

    // Get the match
    const { data: match, error: matchError } = await supabase
      .from('buddy_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Verify user is part of this match
    if (match.user_id_1 !== user.id && match.user_id_2 !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Determine which user is responding
    const isUser1 = match.user_id_1 === user.id
    const acceptanceField = isUser1 ? 'user_1_accepted' : 'user_2_accepted'

    if (action === 'decline') {
      // Decline the match
      const { error: updateError } = await supabase
        .from('buddy_matches')
        .update({ status: 'declined', [acceptanceField]: false })
        .eq('id', matchId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update match' },
          { status: 500 }
        )
      }

      // Notify the other user
      const otherUserId = isUser1 ? match.user_id_2 : match.user_id_1
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'buddy_match_declined',
        title: 'Buddy match declined',
        message: `Your buddy match request was declined`,
        related_event_id: match.event_id,
      })

      return NextResponse.json({ message: 'Match declined' })
    }

    // Accept the match
    const user1Accepted = isUser1 ? true : match.user_1_accepted
    const user2Accepted = isUser1 ? match.user_2_accepted : true

    // Check if both users have now accepted
    const bothAccepted = user1Accepted && user2Accepted
    const newStatus = bothAccepted ? 'accepted' : 'pending'

    const { error: updateError } = await supabase
      .from('buddy_matches')
      .update({
        status: newStatus,
        user_1_accepted: user1Accepted,
        user_2_accepted: user2Accepted,
      })
      .eq('id', matchId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update match' },
        { status: 500 }
      )
    }

    // Send notification if match is now fully accepted
    if (bothAccepted) {
      const otherUserId = isUser1 ? match.user_id_2 : match.user_id_1
      await supabase.from('notifications').insert({
        user_id: otherUserId,
        type: 'buddy_match_accepted',
        title: 'Buddy match confirmed!',
        message: `Your buddy match has been confirmed`,
        related_event_id: match.event_id,
      })
    }

    return NextResponse.json({
      message: bothAccepted ? 'Match confirmed!' : 'Match accepted',
      status: newStatus,
    })
  } catch (error) {
    console.error('Error updating buddy match:', error)
    return NextResponse.json(
      { error: 'Failed to update buddy match' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel a match
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params

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

    // Get the match
    const { data: match, error: matchError } = await supabase
      .from('buddy_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    // Verify user is part of this match
    if (match.user_id_1 !== user.id && match.user_id_2 !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('buddy_matches')
      .update({ status: 'cancelled' })
      .eq('id', matchId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to cancel match' },
        { status: 500 }
      )
    }

    // Notify the other user
    const otherUserId = match.user_id_1 === user.id ? match.user_id_2 : match.user_id_1
    await supabase.from('notifications').insert({
      user_id: otherUserId,
      type: 'buddy_match_cancelled',
      title: 'Buddy match cancelled',
      message: `Your buddy match was cancelled`,
      related_event_id: match.event_id,
    })

    return NextResponse.json({ message: 'Match cancelled' })
  } catch (error) {
    console.error('Error deleting buddy match:', error)
    return NextResponse.json(
      { error: 'Failed to delete buddy match' },
      { status: 500 }
    )
  }
}
