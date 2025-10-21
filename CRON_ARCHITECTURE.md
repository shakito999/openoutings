# Notification Cron System Architecture

## 📊 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   pg_cron    │         │   events     │                 │
│  │  Extension   │         │   table      │                 │
│  └──────┬───────┘         └──────────────┘                 │
│         │ Every hour                                        │
│         │ (0 * * * *)                                       │
└─────────┼───────────────────────────────────────────────────┘
          │
          │ HTTP POST Request
          ▼
┌─────────────────────────────────────────────────────────────┐
│              Your Next.js App (Vercel/etc.)                  │
│                                                              │
│  Route: /api/notifications/send-reminders                   │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │ 1. Verify CRON_SECRET                          │         │
│  │ 2. Query events starting in 24h/1h             │         │
│  │ 3. For each event, get attendees               │         │
│  │ 4. Create notifications                        │         │
│  └────────────────────────────────────────────────┘         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Create notifications
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│                                                              │
│  ┌──────────────────────────────────────────────┐           │
│  │        notifications table                   │           │
│  │  - event_reminder_24h                        │           │
│  │  - event_reminder_1h                         │           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Supabase Realtime
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │  NotificationBell Component                │             │
│  │  - Receives real-time update               │             │
│  │  - Shows badge with unread count           │             │
│  │  - User clicks → sees notification         │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Simplified Flow

1. **Every hour**, Supabase's `pg_cron` extension runs
2. **Cron calls** your API: `POST /api/notifications/send-reminders`
3. **API checks** which events start in 24h or 1h
4. **API creates** notification records in database
5. **Supabase Realtime** pushes to connected users
6. **Bell icon** updates instantly in user's browser

## 🎯 Two Setup Options

### Option A: Direct (Simplest) ⭐ RECOMMENDED

```
Supabase pg_cron → Your Next.js API
```

**Pros:**
- Simple setup (just SQL)
- No extra services needed
- Built into Supabase

**Cons:**
- Need Supabase Pro for pg_cron (or use free tier with limitations)

### Option B: With Edge Function

```
Supabase pg_cron → Supabase Edge Function → Your Next.js API
```

**Pros:**
- More control
- Can add logic in Edge Function
- Better logging

**Cons:**
- More setup steps
- Need to deploy Edge Function

## 🔑 Environment Variables Needed

### In Supabase (for cron job)
```
Nothing! Cron job uses direct SQL with your app URL
```

### In Your Next.js App (Vercel/etc.)
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=
```

### In Supabase Edge Function (if using Option B)
```
APP_URL=https://your-app.vercel.app
CRON_SECRET=jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=
```

## 📅 Cron Schedule Examples

```sql
-- Every hour at minute 0 (recommended)
'0 * * * *'

-- Every 30 minutes
'*/30 * * * *'

-- Every day at 9 AM
'0 9 * * *'

-- Every Monday at 10 AM
'0 10 * * 1'
```

Current setup: `'0 * * * *'` = Every hour

## 🔍 What Happens Each Hour

```sql
-- Events starting in ~24 hours (±15 min buffer)
Events at 2025-10-22 02:00 → Notification at 2025-10-21 02:00
Events at 2025-10-22 15:30 → Notification at 2025-10-21 15:00

-- Events starting in ~1 hour (±15 min buffer)
Events at 2025-10-21 03:00 → Notification at 2025-10-21 02:00
Events at 2025-10-21 16:30 → Notification at 2025-10-21 15:00
```

The ±15 minute buffer ensures notifications are sent even if timing isn't perfect.

## 🐛 Debugging Flow

### 1. Check if Cron is Running
```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'send-notification-reminders'
ORDER BY start_time DESC
LIMIT 5;
```

### 2. Check if API was Called
Look at your hosting platform logs (Vercel/Netlify) for:
```
POST /api/notifications/send-reminders
```

### 3. Check if Notifications were Created
```sql
SELECT * FROM notifications 
WHERE type IN ('event_reminder_24h', 'event_reminder_1h')
ORDER BY created_at DESC;
```

### 4. Check if Events Exist in Time Window
```sql
-- Events in next 24 hours
SELECT * FROM events 
WHERE starts_at BETWEEN NOW() + INTERVAL '23 hours 45 minutes' 
AND NOW() + INTERVAL '24 hours 15 minutes';

-- Events in next 1 hour  
SELECT * FROM events 
WHERE starts_at BETWEEN NOW() + INTERVAL '45 minutes' 
AND NOW() + INTERVAL '75 minutes';
```

## 📊 Expected Behavior

### First Hour After Setup
- Cron runs
- Checks for events
- If no events in 24h/1h window → returns `{"notificationsSent": 0}`
- If events exist → creates notifications

### Subsequent Hours
- Cron runs again
- Checks for duplicate notifications
- Only sends if not already sent
- Returns count of new notifications

## ✅ Success Indicators

1. **Cron job exists**: `SELECT * FROM cron.job;` shows your job
2. **Job runs hourly**: `cron.job_run_details` shows new entries each hour
3. **API responds 200**: Check logs show successful responses
4. **Notifications created**: Database shows reminder notifications
5. **Users see notifications**: Bell icon shows badge

---

**Quick Start**: See `CRON_QUICK_START.md` for 5-minute setup  
**Full Guide**: See `SUPABASE_CRON_SETUP.md` for all options
