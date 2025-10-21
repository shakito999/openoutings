# Supabase Cron Job Setup for Notifications

## 📋 Prerequisites

- Supabase CLI installed
- Supabase project linked
- Your app deployed to production (Vercel, Netlify, etc.)

## 🔧 Setup Steps

### 1. Install Supabase CLI (if not already installed)

```powershell
# Using npm
npm install -g supabase

# Or using scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Link Your Supabase Project

```powershell
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

To find your project ref:
1. Go to Supabase Dashboard → Settings → General
2. Look for "Reference ID"

### 3. Set Environment Variables in Supabase

Go to Supabase Dashboard → Edge Functions → Settings and add:

**Required Variables:**
```
APP_URL=https://your-app-domain.com
CRON_SECRET=jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=
```

Replace:
- `APP_URL` with your deployed app URL (e.g., `https://openoutings.vercel.app`)
- `CRON_SECRET` with the generated secret above (or generate a new one)

**Important:** This `CRON_SECRET` must match the one in your Next.js `.env` variables!

### 4. Deploy the Edge Function

```powershell
# Deploy the function
supabase functions deploy send-notification-reminders

# Verify deployment
supabase functions list
```

### 5. Set Up Cron Schedule in Supabase

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard → Database → Cron Jobs (pg_cron extension)
2. Enable pg_cron if not already enabled
3. Add new cron job:

```sql
-- Run every hour at minute 0
SELECT cron.schedule(
  'send-notification-reminders',    -- Job name
  '0 * * * *',                       -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://your-project-ref.supabase.co/functions/v1/send-notification-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

Replace:
- `your-project-ref` with your Supabase project reference ID
- `YOUR_ANON_KEY` with your Supabase Anon Key (Dashboard → Settings → API)

#### Option B: Using SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the cron job
SELECT cron.schedule(
  'send-notification-reminders',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-notification-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

### 6. Add Environment Variables to Your Next.js App

Make sure your production environment has these variables:

**Vercel:**
```powershell
# Go to Vercel Dashboard → Your Project → Settings → Environment Variables
# Add:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_supabase
CRON_SECRET=jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=
```

**Other Platforms:** Add the same variables to your hosting platform's environment variables section.

### 7. Test the Setup

#### Test Edge Function Manually
```powershell
supabase functions invoke send-notification-reminders
```

#### Check Logs
```powershell
# View Edge Function logs
supabase functions logs send-notification-reminders

# Or in Dashboard → Edge Functions → send-notification-reminders → Logs
```

#### Test API Route Directly
```powershell
curl -X POST https://your-app-domain.com/api/notifications/send-reminders `
  -H "Authorization: Bearer jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=" `
  -H "Content-Type: application/json"
```

### 8. Verify Cron Job is Running

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- Check job run history
SELECT * FROM cron.job_run_details 
WHERE jobname = 'send-notification-reminders'
ORDER BY start_time DESC
LIMIT 10;
```

## 📊 Monitoring

### View Logs in Supabase
1. Dashboard → Edge Functions → send-notification-reminders → Logs
2. Look for successful executions every hour

### Check Database for Notifications
```sql
SELECT 
  type,
  COUNT(*) as count,
  MAX(created_at) as last_created
FROM notifications
WHERE type IN ('event_reminder_24h', 'event_reminder_1h')
GROUP BY type;
```

## 🐛 Troubleshooting

### Edge Function Not Working
```powershell
# Check function status
supabase functions list

# View recent logs
supabase functions logs send-notification-reminders --limit 50
```

### Cron Job Not Executing
```sql
-- Check if pg_cron is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Check if job exists
SELECT * FROM cron.job WHERE jobname = 'send-notification-reminders';

-- View recent runs
SELECT * FROM cron.job_run_details 
WHERE jobname = 'send-notification-reminders'
ORDER BY start_time DESC;
```

### API Route Returns 401
- Verify `CRON_SECRET` matches in both Supabase Edge Function and Next.js
- Check environment variables are set in production

### No Notifications Being Sent
- Ensure events exist in the database within 24h/1h window
- Check Supabase service role key is correct
- View API route logs in your hosting platform

## 🔄 Update the Edge Function

If you need to update the function:

```powershell
# Make changes to supabase/functions/send-notification-reminders/index.ts
# Then redeploy
supabase functions deploy send-notification-reminders
```

## 📝 Alternative: Simpler HTTP Cron (Without Edge Function)

If you prefer not to use Edge Functions, you can use an external cron service:

### Using cron-job.org

1. Sign up at https://cron-job.org
2. Create new cron job:
   - **Title**: "Notification Reminders"
   - **URL**: `https://your-app-domain.com/api/notifications/send-reminders`
   - **Method**: POST
   - **Headers**: 
     ```
     Authorization: Bearer jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=
     Content-Type: application/json
     ```
   - **Schedule**: Every 1 hour (0 * * * *)
3. Save and enable

### Using EasyCron

1. Sign up at https://www.easycron.com
2. Add new cron job with same settings as above

## ✅ Final Checklist

- [ ] Supabase CLI installed and logged in
- [ ] Edge Function deployed
- [ ] Environment variables set in Supabase (APP_URL, CRON_SECRET)
- [ ] Environment variables set in Next.js (SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET)
- [ ] Cron job created in Supabase (pg_cron)
- [ ] Tested edge function manually
- [ ] Verified cron job runs (check after 1 hour)
- [ ] Checked notifications are being created

---

**Your CRON_SECRET (save this!):**
```
jkHg7tvCUmUFjGPxWvs9If8MKwG/eWx/VZVe+bu13w4=
```

Use this same value in:
1. Supabase Edge Function environment variables (APP_URL, CRON_SECRET)
2. Next.js production environment variables (CRON_SECRET)
