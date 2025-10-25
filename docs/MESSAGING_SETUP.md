# Messaging System Setup Instructions

## ✅ Step 1: Database Migration (COMPLETED)
You've already run the migration in the Supabase SQL Editor!

## 📡 Step 2: Enable Realtime for Tables

Go to your Supabase Dashboard:

1. Navigate to **Database** → **Replication**
2. Enable Realtime for these 3 tables:
   - ✅ `messages`
   - ✅ `conversations`
   - ✅ `conversation_participants`

Click the toggle next to each table to enable replication.

## 🔧 Step 3: Deploy Edge Function (Optional but Recommended)

### Option A: Manual Deployment via Supabase Dashboard

Since you don't have the CLI installed, you can deploy the edge function directly in the dashboard:

1. Go to **Edge Functions** in your Supabase Dashboard
2. Click **Create a new function**
3. Name it: `cleanup-messages`
4. Copy the code from `supabase/functions/cleanup-messages/index.ts` and paste it
5. Click **Deploy**

### Option B: Install Supabase CLI (Recommended for future)

**On Windows, use npm:**
```powershell
npm install -g supabase
```

Then link your project:
```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Deploy the function:
```powershell
supabase functions deploy cleanup-messages
```

## ⏰ Step 4: Schedule Daily Cleanup

You have 3 options:

### Option 1: Supabase Cron (Easiest - if available in your plan)

Run this SQL in your Supabase SQL Editor:

```sql
-- Check if pg_cron is available
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- If available, schedule the cleanup
SELECT cron.schedule(
  'cleanup-old-messages',
  '0 2 * * *', -- Run at 2 AM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-messages',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
    )
  )
  $$
);
```

**Replace:**
- `YOUR_PROJECT_REF` with your Supabase project reference (found in Settings → General)
- `YOUR_SUPABASE_SERVICE_ROLE_KEY` with your service role key (Settings → API → service_role key - keep this secret!)

### Option 2: GitHub Actions (Free & Reliable)

Create `.github/workflows/cleanup-messages.yml`:

```yaml
name: Cleanup Old Messages

on:
  schedule:
    - cron: '0 2 * * *'  # Run at 2 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call cleanup function
        run: |
          curl -X POST \
            'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-messages' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json'
```

**Setup:**
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add secret: `SUPABASE_SERVICE_ROLE_KEY`
3. Replace `YOUR_PROJECT_REF` in the workflow file
4. Commit and push

### Option 3: External Cron Service (Free alternatives)

Use a service like [cron-job.org](https://cron-job.org):

1. Sign up for free
2. Create new cron job
3. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-messages`
4. Schedule: Daily at 2 AM
5. Add HTTP header:
   - Name: `Authorization`
   - Value: `Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY`

### Option 4: Simple Alternative - Database-Only Cleanup

If you don't want to set up edge functions, you can use a simpler SQL-only approach:

**Run this SQL to create a scheduled job (if pg_cron is available):**

```sql
SELECT cron.schedule(
  'cleanup-old-messages-direct',
  '0 2 * * *', -- Run at 2 AM UTC daily
  $$SELECT cleanup_old_messages()$$
);
```

This calls the database function directly without needing an edge function!

## 🧪 Step 5: Test the Cleanup Function

Test manually in the SQL Editor:

```sql
SELECT cleanup_old_messages();
```

You should see a notice: "Message cleanup completed"

## 🎯 Step 6: Verify Everything Works

1. **Check Realtime is enabled:**
   - Go to Database → Replication
   - Confirm toggles are ON for `messages`, `conversations`, `conversation_participants`

2. **Test the messaging page:**
   - Navigate to `/messages` in your app
   - Check browser console for any errors
   - WebSocket connection should establish automatically

3. **Test creating a conversation:**
   ```typescript
   // In your app, try starting a conversation
   const { startDirectConversation } = useConversations()
   await startDirectConversation('other-user-id')
   ```

## 📊 Monitoring

To monitor the cleanup job:

```sql
-- Check recent cleanup runs (if using pg_cron)
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-old-messages')
ORDER BY runid DESC 
LIMIT 10;

-- Check current message count
SELECT COUNT(*) as total_messages FROM messages;

-- Check oldest message age
SELECT 
  NOW() - created_at as age,
  created_at 
FROM messages 
ORDER BY created_at ASC 
LIMIT 1;
```

## ⚠️ Important Notes

1. **Service Role Key Security**: Never commit your service role key to Git. Always use environment variables or GitHub secrets.

2. **Realtime Costs**: Supabase Realtime is included in all plans, but monitor your usage in the dashboard.

3. **Database Backups**: The cleanup permanently deletes messages. Ensure you have database backups if needed.

4. **First Run**: The first cleanup will only delete messages older than 30 days, so you won't see immediate changes unless you have old test data.

## 🚀 Quick Start Checklist

- [x] Run database migration (DONE)
- [ ] Enable Realtime for 3 tables
- [ ] Deploy edge function OR set up direct SQL cleanup
- [ ] Schedule daily cleanup (choose one option above)
- [ ] Test manually with `SELECT cleanup_old_messages();`
- [ ] Verify messaging page loads without errors

## Need Help?

If something doesn't work:
1. Check browser console for errors
2. Check Supabase logs in the dashboard
3. Verify RLS policies are enabled
4. Ensure your user has proper permissions
