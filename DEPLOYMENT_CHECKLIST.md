# Notification System - Deployment Checklist

## 🚀 Quick Deploy Steps

### 1. Database Migration (5 minutes)
```bash
# Option A: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire content from: supabase/migrations/20250120_add_notifications.sql
3. Paste and click "Run"

# Option B: Using Supabase CLI (if linked)
supabase db push
```

**Verify**: Check that `notifications` table exists in Database → Tables

---

### 2. Enable Realtime (2 minutes)
```bash
1. Supabase Dashboard → Database → Replication
2. Find "notifications" table
3. Toggle ON for INSERT events
```

**Verify**: You should see "Realtime enabled" next to the table

---

### 3. Environment Variables (3 minutes)

Add to your `.env.local` (or production environment):

```env
# Get from Supabase Dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Generate with: openssl rand -base64 32
CRON_SECRET=YOUR_RANDOM_SECRET_STRING
```

**Verify**: `echo $SUPABASE_SERVICE_ROLE_KEY` should show your key

---

### 4. Deploy Code (2 minutes)

```bash
git add .
git commit -m "feat: add notification system"
git push
```

**Verify**: Check deployment logs for successful build

---

### 5. Set Up Cron Job (5 minutes)

#### Option A: Vercel (Recommended)

Create `vercel.json` in project root:
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

Then redeploy:
```bash
git add vercel.json
git commit -m "feat: add cron job for notifications"
git push
```

#### Option B: External Cron Service

1. Sign up at cron-job.org or easycron.com
2. Create new job:
   - **URL**: `https://your-domain.com/api/notifications/send-reminders`
   - **Method**: POST
   - **Schedule**: `0 * * * *` (every hour)
   - **Headers**: `Authorization: Bearer YOUR_CRON_SECRET`

**Verify**: Check cron service logs after 1 hour

---

### 6. Test Everything (10 minutes)

#### Test 1: Event Join Notification
1. Create event with User A
2. Join with User B
3. Check User A gets notification (bell icon should show badge)

✅ Expected: User A sees "Нов участник в събитието"

#### Test 2: Follow Notification
1. User A follows User B
2. Check User B gets notification

✅ Expected: User B sees "Нов последовател"

#### Test 3: Notifications Page
1. Go to `/notifications`
2. Check notifications display correctly
3. Click notification → should navigate to event/profile
4. Click "Mark all as read"

✅ Expected: All work correctly

#### Test 4: Real-time Updates
1. Open app in two browsers (different users)
2. Trigger notification in browser 1
3. Watch browser 2 update instantly

✅ Expected: Bell badge updates without refresh

#### Test 5: Event Cancellation
1. Create event and have users join
2. Update event: `UPDATE events SET is_cancelled = true WHERE id = X`
3. Check all attendees get notifications

✅ Expected: All attendees notified

---

## ⚠️ Common Issues

### Issue: Notifications not appearing
**Fix**: Check Supabase logs for trigger errors. Ensure migration ran successfully.

### Issue: Real-time not working
**Fix**: Enable Replication for `notifications` table in Supabase Dashboard.

### Issue: Cron job failing
**Fix**: Verify `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly.

### Issue: TypeScript errors
**Fix**: Existing error in `SimilarEvents.tsx` is unrelated. Our notification code is clean.

---

## 📊 Monitoring

### Check Notifications are Being Created
```sql
-- Run in Supabase SQL Editor
SELECT 
  type,
  COUNT(*) as count,
  MAX(created_at) as last_created
FROM notifications
GROUP BY type
ORDER BY count DESC;
```

### Check Unread Notifications
```sql
SELECT 
  p.full_name,
  COUNT(*) as unread_count
FROM notifications n
JOIN profiles p ON n.user_id = p.id
WHERE n.is_read = false
GROUP BY p.full_name
ORDER BY unread_count DESC
LIMIT 10;
```

### Check Cron Job Success
Look for API logs at `/api/notifications/send-reminders` in your hosting platform.

---

## ✅ Final Verification

- [ ] Database migration applied successfully
- [ ] Realtime enabled for notifications table
- [ ] Environment variables set
- [ ] Code deployed to production
- [ ] Cron job configured and running
- [ ] Event join creates notification
- [ ] Follow creates notification
- [ ] Notifications page works
- [ ] Real-time updates work
- [ ] Bell icon shows unread count
- [ ] Mark as read works

---

## 🎉 You're Done!

The notification system is now live. Users will receive:
- ✅ Real-time notifications when someone joins their events
- ✅ Follow notifications
- ✅ Event reminders (24h & 1h before)
- ✅ Cancellation alerts

**Next Feature**: Check `NextToDo.txt` for Direct Messaging System (#1 priority)

---

## 📚 Documentation

- Full setup guide: `NOTIFICATIONS_SETUP.md`
- Feature summary: `NOTIFICATIONS_SUMMARY.md`
- This checklist: `DEPLOYMENT_CHECKLIST.md`
