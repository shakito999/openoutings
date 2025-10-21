// Supabase Edge Function to trigger notification reminders
// This function calls your Next.js API route to send event reminders

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    // Get environment variables
    const appUrl = Deno.env.get('APP_URL')
    const cronSecret = Deno.env.get('CRON_SECRET')

    if (!appUrl || !cronSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing APP_URL or CRON_SECRET environment variables' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Call your Next.js API route
    const response = await fetch(`${appUrl}/api/notifications/send-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Error sending reminders:', data)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send reminders',
          details: data 
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Reminders sent successfully:', data)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        ...data 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
