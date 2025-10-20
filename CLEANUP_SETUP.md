# Event Cleanup Cron Job Setup

## Overview
Events older than 30 days are automatically deleted, including their photos from storage. This prevents database bloat and saves on Supabase storage costs.

---

## What Gets Deleted

After **30 days** from the event end date (or start date if no end date):
- The event record
- Event photos from Supabase storage
- Event attendees (cascade)
- Event photos records (cascade)
- QR codes (cascade)
- Check-ins (cascade)
- All related data (cascade)

---

## Setup Steps

### Option 1: Supabase Cron (Recommended)

1. **Deploy the Edge Function**
   ```bash
   # From project root
   npx supabase functions deploy cleanup-old-events
   ```

2. **Set up Cron in Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **Database** → **Cron Jobs** (or use pg_cron extension)
   - Create a new cron job:
   
   ```sql
   -- Run daily at 3 AM UTC
   SELECT cron.schedule(
     'cleanup-old-events',
     '0 3 * * *',
     $$
     SELECT net.http_post(
       url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-old-events',
       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     )
     $$
   );
   ```

3. **Replace placeholders:**
   - `YOUR_PROJECT_REF` - Your Supabase project reference
   - `YOUR_SERVICE_ROLE_KEY` - Your service role key (keep secret!)

---

### Option 2: External Cron Service

If you prefer using an external service like Cron-job.org or GitHub Actions:

#### GitHub Actions (Free)

Create `.github/workflows/cleanup-events.yml`:

```yaml
name: Cleanup Old Events

on:
  schedule:
    # Run daily at 3 AM UTC
    - cron: '0 3 * * *'
  workflow_dispatch: # Manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cleanup Function
        run: |
          curl -X POST \
            'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-old-events' \
            -H 'Content-Type: application/json' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}'
```

Add `SUPABASE_SERVICE_ROLE_KEY` to your GitHub repository secrets.

---

### Option 3: Manual Cleanup

Run manually when needed:

```bash
# Using curl
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-old-events' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'

# Or directly in database
SELECT cleanup_old_events();
```

---

## Monitoring

### Check Logs

**Supabase Edge Function Logs:**
- Go to Supabase Dashboard → Functions → cleanup-old-events → Logs

**PostgreSQL Logs:**
```sql
-- Check recent function calls
SELECT * FROM pg_stat_user_functions 
WHERE funcname = 'cleanup_old_events';
```

### Test the Function

```bash
# Test locally with Supabase CLI
npx supabase functions serve cleanup-old-events

# Then trigger it
curl -X POST 'http://localhost:54321/functions/v1/cleanup-old-events' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```

---

## Troubleshooting

### Events Not Being Deleted

1. **Check if function is running:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'cleanup-old-events';
   ```

2. **Check for errors:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-old-events')
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

3. **Manually test:**
   ```sql
   SELECT cleanup_old_events();
   ```

### Photos Not Being Deleted

- Check storage bucket name in Edge Function matches your setup
- Verify service role key has storage delete permissions
- Check Supabase storage logs for delete attempts

---

## Changing the Retention Period

### To change from 30 days to something else:

**In the migration file:**
```sql
-- Change INTERVAL '30 days' to your desired period
WHERE ends_at < NOW() - INTERVAL '90 days'  -- 90 days for example
```

**In the Edge Function:**
```typescript
// Change 30 to your desired number of days
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);  // 90 days for example
```

---

## Cost Savings Example

Assuming:
- 100 events per month
- 3 photos per event (avg 2MB each)
- $0.021/GB/month for Supabase storage

**Without cleanup:**
- After 1 year: 1,200 events × 3 photos × 2MB = 7.2GB
- Cost: ~$0.15/month (growing forever)

**With 30-day cleanup:**
- Maximum: 100 events × 3 photos × 2MB = 600MB
- Cost: ~$0.01/month (stable)

**Savings: 94% reduction in storage costs**

---

## Security Notes

- **Never commit service role keys** to version control
- Use environment variables or secrets management
- The Edge Function uses service role to bypass RLS policies
- Only authorized cron jobs should trigger the function

---

## Need to Restore Deleted Events?

Unfortunately, once deleted, events cannot be restored. Consider:
- Exporting important event data before 30 days
- Implementing a "soft delete" if you need event history
- Adjusting the retention period based on your needs

---

## Summary

✅ Events auto-delete after 30 days  
✅ Photos removed from storage  
✅ Saves costs and reduces database size  
✅ Fully automated once set up  
✅ Can be manually triggered anytime  

For questions or issues, check the Edge Function logs in your Supabase dashboard.
