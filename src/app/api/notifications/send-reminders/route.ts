import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This should be called by a cron job (e.g., Vercel Cron, Supabase Edge Function, or external scheduler)
// Set up to run every hour

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source (e.g., cron job)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000)
    
    // Add buffer windows (±15 minutes) to account for cron timing
    const window24hStart = new Date(in24Hours.getTime() - 15 * 60 * 1000)
    const window24hEnd = new Date(in24Hours.getTime() + 15 * 60 * 1000)
    const window1hStart = new Date(in1Hour.getTime() - 15 * 60 * 1000)
    const window1hEnd = new Date(in1Hour.getTime() + 15 * 60 * 1000)

    let totalNotifications = 0

    // ====== 24 HOUR REMINDERS ======
    const { data: events24h, error: error24h } = await supabase
      .from('events')
      .select('id, title, starts_at, host_id')
      .gte('starts_at', window24hStart.toISOString())
      .lte('starts_at', window24hEnd.toISOString())
      .eq('is_cancelled', false)

    if (!error24h && events24h) {
      for (const event of events24h) {
        // Get all attendees for this event
        const { data: attendees } = await supabase
          .from('event_attendees')
          .select('user_id')
          .eq('event_id', event.id)

        if (attendees) {
          for (const attendee of attendees) {
            // Check if notification already sent
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', attendee.user_id)
              .eq('type', 'event_reminder_24h')
              .eq('related_event_id', event.id)
              .single()

            if (!existing) {
              // Send 24h reminder
              await supabase.from('notifications').insert({
                user_id: attendee.user_id,
                type: 'event_reminder_24h',
                title: 'Напомняне за събитие',
                message: `Събитието "${event.title}" е утре в ${new Date(event.starts_at).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}`,
                related_event_id: event.id,
              })
              totalNotifications++
            }
          }
        }
      }
    }

    // ====== 1 HOUR REMINDERS ======
    const { data: events1h, error: error1h } = await supabase
      .from('events')
      .select('id, title, starts_at, host_id')
      .gte('starts_at', window1hStart.toISOString())
      .lte('starts_at', window1hEnd.toISOString())
      .eq('is_cancelled', false)

    if (!error1h && events1h) {
      for (const event of events1h) {
        // Get all attendees for this event
        const { data: attendees } = await supabase
          .from('event_attendees')
          .select('user_id')
          .eq('event_id', event.id)

        if (attendees) {
          for (const attendee of attendees) {
            // Check if notification already sent
            const { data: existing } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', attendee.user_id)
              .eq('type', 'event_reminder_1h')
              .eq('related_event_id', event.id)
              .single()

            if (!existing) {
              // Send 1h reminder
              await supabase.from('notifications').insert({
                user_id: attendee.user_id,
                type: 'event_reminder_1h',
                title: 'Събитието започва скоро!',
                message: `Събитието "${event.title}" започва след 1 час`,
                related_event_id: event.id,
              })
              totalNotifications++
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      notificationsSent: totalNotifications,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Error sending reminders:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}
