# Real-Time Messaging System

## Overview

Cost-efficient real-time messaging system with automatic data retention policies to minimize storage and bandwidth costs.

## Features

- **1:1 Direct Messages**: Between users who mutually follow each other
- **Event Group Chats**: Automatically created for event participants
- **Automatic Cleanup**: 
  - All messages deleted after 30 days
  - Event group chats deleted 5 days after event ends
- **Real-time Updates**: WebSocket-based real-time messaging via Supabase Realtime
- **Cost Optimizations**:
  - Client-side pagination (50 messages per page)
  - Indexed queries for fast retrieval
  - Row Level Security (RLS) to prevent data over-fetching
  - Batch operations where possible

## Setup

### 1. Run the Database Migration

```bash
supabase migration up
```

This creates:
- `conversations` table
- `conversation_participants` table
- `messages` table
- Required indexes
- RLS policies
- Helper functions

### 2. Deploy the Cleanup Edge Function

```bash
supabase functions deploy cleanup-messages
```

### 3. Schedule Daily Cleanup

Option A: Using Supabase Cron (if available in your plan)
```sql
SELECT cron.schedule(
  'cleanup-old-messages',
  '0 2 * * *', -- Run at 2 AM daily
  $$SELECT net.http_post(
    url:='https://your-project.supabase.co/functions/v1/cleanup-messages',
    headers:='{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  )$$
);
```

Option B: Use external cron service (e.g., GitHub Actions, cron-job.org)
Schedule a daily HTTP POST to:
```
https://your-project.supabase.co/functions/v1/cleanup-messages
```
With header:
```
Authorization: Bearer YOUR_SERVICE_ROLE_KEY
```

## Usage

### Starting a Direct Conversation

```typescript
const { startDirectConversation } = useConversations()

// Users must follow each other
const conversation = await startDirectConversation(otherUserId)
```

### Accessing Event Group Chat

```typescript
const { getEventGroupChat } = useConversations()

// User must be part of the event
const conversation = await getEventGroupChat(eventId)
```

### Sending Messages

```typescript
const { sendMessage } = useMessages(conversationId)

await sendMessage('Hello! 👋')
```

### Real-time Updates

Both hooks automatically subscribe to real-time updates:
- New messages appear instantly
- Unread counts update automatically
- Conversation list stays synchronized

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

- **Conversations**: Users can only see conversations they're part of
- **Messages**: Users can only see messages in their conversations
- **Participants**: Users can only see participants in their conversations

### Mutual Follow Requirement

Direct conversations require mutual follows:
```sql
-- Checked in get_or_create_direct_conversation()
SELECT EXISTS (
  SELECT 1 FROM user_follows 
  WHERE follower_id = user_1 AND following_id = user_2
) AND EXISTS (
  SELECT 1 FROM user_follows 
  WHERE follower_id = user_2 AND following_id = user_1
)
```

### Event Participation Requirement

Event group chats require event participation:
```typescript
// Verified in API route
const { data: attendee } = await supabase
  .from('event_attendees')
  .select('*')
  .eq('event_id', eventId)
  .eq('user_id', user.id)
  .single()
```

## Cost Optimization

### Database Indexes

Critical indexes for performance:
```sql
-- Pagination index (most important)
CREATE INDEX idx_messages_conversation_created 
  ON messages(conversation_id, created_at DESC);

-- Conversation lookup
CREATE INDEX idx_conversation_participants_user 
  ON conversation_participants(user_id);
```

### Client-Side Pagination

Messages are paginated with cursor-based pagination:
```typescript
// Load 50 messages at a time
const { messages, hasMore, loadMore } = useMessages(conversationId)

// Load older messages
if (hasMore) {
  loadMore()
}
```

### Batch Queries

The API combines related data in single queries:
```typescript
// Get conversations with participants, last message, and event in one query
.select(`
  *,
  participants:conversation_participants(...),
  event:events(...),
  messages(...)
`)
```

## Warnings to Users

The system displays prominent warnings:

1. **Conversation List**: "Messages are deleted after 30 days. Event chats are deleted 5 days after the event ends."

2. **Event Group Chats**: "Chat will be deleted 5 days after event ends"

3. **Direct Messages**: "Messages are deleted after 30 days"

## API Routes

- `GET /api/conversations` - List user's conversations
- `POST /api/conversations/direct` - Start/get direct conversation
- `POST /api/conversations/event` - Get event group chat
- `GET /api/conversations/[id]/messages` - Get messages (paginated)
- `POST /api/conversations/[id]/messages` - Send message

## Database Functions

### `get_or_create_direct_conversation(user_id_1, user_id_2)`
Creates or retrieves a direct conversation between two users who follow each other.

### `create_event_group_chat(event_id)`
Creates or retrieves the group chat for an event.

### `cleanup_old_messages()`
Deletes old messages according to retention policies. Should be called daily.

## Monitoring

Monitor these metrics:
- Message table size
- Cleanup job success rate
- Average messages per conversation
- Real-time subscription count

## Future Enhancements

Consider adding:
- Message reactions (lightweight, just emoji)
- Typing indicators
- Read receipts
- Message search (use PostgreSQL full-text search with limits)
- File attachments (requires careful cost analysis)

## Troubleshooting

### Messages not appearing in real-time
1. Check Supabase Realtime is enabled for the tables
2. Verify RLS policies allow the user to see messages
3. Check browser console for WebSocket errors

### "Users must follow each other" error
1. Verify both users have follow relationships in `user_follows` table
2. Check RLS policies on `user_follows` table

### Cleanup not running
1. Verify cron job is scheduled
2. Check edge function logs
3. Manually test: `SELECT cleanup_old_messages();`
