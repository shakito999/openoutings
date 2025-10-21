# Notifications System Setup Guide

## Overview

The notification system provides real-time notifications for:
- ✅ When someone joins your event
- ✅ When someone follows you
- ✅ When an event is cancelled
- ⏰ Event reminders (24h and 1h before)
- 📝 Event updates (future)
- 🎉 New events from people you follow (future)

## Database Setup

### 1. Run the Migration

Execute the migration file to create the notifications table and triggers:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Dashboard
# File: supabase/migrations/20250120_add_notifications.sql
```

### 2. Enable Realtime for Notifications Table

In your Supabase Dashboard:
1. Go to Database → Replication
2. Find the `notifications` table
3. Enable replication for INSERT events

## Environment Variables

Add these to your `.env.local` file:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# NEW: Required for cron job API route
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=generate_a_random_secret_string
```

**Important**: 
- `SUPABASE_SERVICE_ROLE_KEY` can be found in Supabase Dashboard → Settings → API
- `CRON_SECRET` should be a random string (e.g., `openssl rand -base64 32`)

## Setting Up Event Reminders (Cron Job)

Event reminders require a scheduled task that runs hourly. Choose one option:

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

Create `vercel.json` in the project root:

```json
{
  "crons": [
    {
      "path": "/api/notifications/send-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour at minute 0.

### Option 2: External Cron Service (EasyCron, cron-job.org, etc.)

1. Sign up for a cron service
2. Create a new cron job:
   - URL: `https://your-domain.com/api/notifications/send-reminders`
   - Method: POST
   - Schedule: Every hour (0 * * * *)
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

### Option 3: Supabase Edge Functions

Create a Supabase Edge Function:

```typescript
// supabase/functions/send-reminders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const response = await fetch('https://your-domain.com/api/notifications/send-reminders', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('CRON_SECRET')}`,
    },
  })
  
  return new Response(JSON.stringify(await response.json()), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Then set up a Supabase cron job in the Dashboard.

## Browser Notifications (Optional)

To enable browser notifications:

1. Add notification permission request in your app
2. The `NotificationBell` component already handles showing notifications when permission is granted

```typescript
// Add this somewhere in your app (e.g., on first login)
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}
```

## Testing

### Test Event Join Notification
1. Create an event with one user
2. Join the event with another user
3. The event host should receive a notification

### Test Follow Notification
1. Follow another user
2. They should receive a notification

### Test Event Cancellation
1. Create an event and have users join
2. Cancel the event (update `is_cancelled` to true)
3. All attendees should receive notifications

### Test Reminders (Manual)
```bash
# Send a POST request to the API route
curl -X POST https://your-domain.com/api/notifications/send-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Features

### Real-time Updates
- Notifications appear instantly via Supabase Realtime
- Bell icon shows unread count in real-time
- New notifications show browser notifications (if permitted)

### Notification Types
- **event_joined**: Someone joined your event
- **event_reminder_24h**: Event starts in 24 hours
- **event_reminder_1h**: Event starts in 1 hour
- **event_cancelled**: Event was cancelled
- **new_follower**: Someone followed you
- **event_updated**: Event details changed (future)
- **new_event_from_following**: Someone you follow created an event (future)

### UI Components
- **NotificationBell**: Dropdown in navigation with recent notifications
- **Notifications Page**: Full page at `/notifications` with filtering

## Troubleshooting

### Notifications not appearing
1. Check Supabase logs for trigger errors
2. Verify RLS policies allow reads for authenticated users
3. Check browser console for errors

### Realtime not working
1. Ensure Replication is enabled for `notifications` table
2. Check Supabase Realtime quota hasn't been exceeded
3. Verify websocket connection in browser DevTools

### Cron job not running
1. Check cron service logs
2. Verify `CRON_SECRET` matches in both places
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is correct
4. Check API route response for errors

## Future Enhancements

Consider adding:
- Email notifications for important events
- Push notifications for mobile
- Notification preferences (which types to receive)
- Bulk delete notifications
- Notification sounds
- Desktop notifications
- Weekly digest of followed users' events
