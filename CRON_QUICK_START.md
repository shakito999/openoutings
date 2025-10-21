# Supabase Cron - Quick Start Guide

## 🚀 5-Minute Setup (Simplest Method)

### Step 1: Add Environment Variables

**In Supabase Dashboard → Settings → API:**
1. Copy your `service_role` key
2. Copy your `anon` key

**In Your Hosting Platform (Vercel/Netlify/etc.):**
Add these environment variables:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from Supabase)
CRON_SECRET=jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=
```

### Step 2: Enable pg_cron in Supabase

**In Supabase Dashboard → SQL Editor**, run:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

### Step 3: Create Cron Job

**In Supabase Dashboard → SQL Editor**, run:
```sql
-- Replace YOUR_APP_URL and YOUR_CRON_SECRET
SELECT cron.schedule(
  'send-notification-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_APP_URL.com/api/notifications/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Replace:
- `YOUR_APP_URL` → your deployed app domain (e.g., `openoutings.vercel.app`)
- `YOUR_CRON_SECRET` → `jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=`

### Step 4: Test It

**In Supabase Dashboard → SQL Editor**, manually trigger:
```sql
-- This calls your API immediately
SELECT net.http_post(
  url := 'https://YOUR_APP_URL.com/api/notifications/send-reminders',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4='
  ),
  body := '{}'::jsonb
);
```

Check the response - should see `{"success": true}`

### Step 5: Verify

```sql
-- Check cron job is scheduled
SELECT * FROM cron.job;

-- After 1 hour, check if it ran
SELECT * FROM cron.job_run_details 
WHERE jobname = 'send-notification-reminders'
ORDER BY start_time DESC;
```

---

## 🎯 That's It!

Your cron job will now run **every hour** at minute 0 (e.g., 1:00, 2:00, 3:00).

It will send:
- 24-hour reminders for events starting tomorrow
- 1-hour reminders for events starting in 1 hour

---

## 🔍 Monitoring

**Check if reminders were sent:**
```sql
SELECT 
  type,
  COUNT(*) as count,
  MAX(created_at) as last_sent
FROM notifications
WHERE type IN ('event_reminder_24h', 'event_reminder_1h')
GROUP BY type;
```

**See recent job runs:**
```sql
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobname = 'send-notification-reminders'
ORDER BY start_time DESC
LIMIT 5;
```

---

## 🔧 Troubleshooting

**Cron job not running?**
```sql
-- Check if extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check if job exists
SELECT * FROM cron.job;
```

**API returns 401?**
- Verify `CRON_SECRET` matches in both Supabase SQL and your hosting environment
- Check your app is deployed and accessible

**No notifications?**
- Create a test event that starts in 24 hours
- Wait for the cron to run (or trigger manually)
- Check the notifications table

---

## 📝 Your Credentials

**Save these for reference:**

```
CRON_SECRET: jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=
APP_URL: https://your-app.vercel.app (replace with your actual URL)
```

---

## 📚 Full Documentation

For more options (Edge Functions, external cron services, etc.), see:
- `SUPABASE_CRON_SETUP.md` - Complete setup guide
- `NOTIFICATIONS_SETUP.md` - Full notification system documentation
