# 🤝 Buddy Matching System - Complete Guide

## Overview

The Buddy Matching System is a unique feature designed to reduce anxiety for solo event attendees by automatically matching them with compatible attendees at the same event. This creates the opportunity for people to meet 30 minutes before the event starts, making the event experience less intimidating.

**The Problem:** People who go to events alone often feel anxious or uncomfortable, especially when there are 10+ strangers. New users to the city especially struggle with this.

**The Solution:** Match solo attendees based on interests, age, past event participation, and other factors, so they have at least one familiar face before arriving at the event.

---

## Architecture

### Database Schema

#### 1. `buddy_preferences`
Stores user preferences for buddy matching.

```sql
- user_id (UUID, primary key) - references profiles
- match_enabled (boolean) - default: true
- anxiety_level (1-10) - how anxious the user feels in group settings
- preferred_age_min (int) - optional age range
- preferred_age_max (int)
- preferred_gender (text) - 'any', 'male', 'female', 'non-binary'
- created_at, updated_at
```

#### 2. `buddy_matches`
Main table tracking matches between two users for an event.

```sql
- id (bigserial, primary key)
- event_id - foreign key to events
- user_id_1, user_id_2 - foreign keys to profiles (ordered for uniqueness)
- status (enum) - 'pending', 'accepted', 'declined', 'completed', 'cancelled'
- compatibility_score (0-100) - numerical score from matching algorithm
- user_1_accepted, user_2_accepted (boolean) - individual acceptance status
- user_1_responded_at, user_2_responded_at (timestamp)
- meeting_time (timestamp) - when buddies should meet before event
- created_at, updated_at
```

**Constraint:** `user_id_1 < user_id_2` ensures consistent ordering (prevents duplicate matches like match(A,B) and match(B,A))

#### 3. `event_attendee_status`
Tracks whether an attendee came solo or with others.

```sql
- event_id, user_id (composite primary key)
- attended_solo (boolean)
- has_buddy_match (boolean)
- created_at
```

#### 4. `user_age`
Privacy-conscious storage of user birth years for age-based matching.

```sql
- user_id (UUID, primary key)
- birth_year (int)
- created_at, updated_at
```

### Compatibility Scoring Algorithm

**Location:** `src/lib/buddyMatching.ts`

The algorithm calculates a 0-100 compatibility score based on:

| Factor | Weight | Details |
|--------|--------|---------|
| **Shared Interests** | 40% | Jaccard similarity of interest lists |
| **Age Proximity** | 25% | Gaussian decay based on age difference |
| **Gender Compatibility** | 20% | Based on user preferences |
| **Event History** | 15% | Similar participation levels |

**Scoring Examples:**
- Same interests, +/- 2 years, no gender restrictions = ~95-100%
- Different interests, +/- 10 years, matching genders = ~65-75%
- Very different interests, 20+ years apart = ~30-40%
- Incompatible gender preferences = 0%

### Components

#### 1. `BuddyMatchingCard` Component
**Location:** `src/components/BuddyMatchingCard.tsx`

Shows buddy match suggestions to users after they join an event.

**Features:**
- Displays one match at a time with compatibility score
- Shows shared interests and why they match
- Accept/Decline buttons
- Navigation through multiple matches
- Real-time UI updates

**Props:**
```typescript
{
  eventId: number      // Event they're attending
  userId: string       // Current user's ID
}
```

#### 2. Buddy Matches Management Page
**Location:** `src/app/buddy-matches/page.tsx`

Central dashboard for viewing and managing all buddy matches.

**Sections:**
- ✅ **Accepted Matches** - Confirmed buddy relationships with meeting times
- ⏳ **Pending Matches** - Awaiting response from either user
- ❌ **Declined Matches** - Archive of declined matches

**Stats:**
- Total accepted matches
- Pending match count
- Total declined matches

### API Endpoint

**Location:** `src/app/api/buddy-matching/route.ts`

**Endpoint:** `POST /api/buddy-matching`

**Actions:**

1. **Find Matches** (`action: 'find-matches'`)
   - Triggered when user joins an event
   - Returns top 3 compatible matches
   - Creates buddy_matches records in database
   
   ```typescript
   Request: {
     action: 'find-matches',
     eventId: number,
     userId: string
   }
   ```

2. **Create Match** (`action: 'create-match'`)
   - Manually create a match between two users
   
   ```typescript
   Request: {
     action: 'create-match',
     eventId: number,
     userId1: string,
     userId2: string,
     compatibilityScore: number
   }
   ```

3. **Respond to Match** (`action: 'respond-to-match'`)
   - Accept or decline a match
   
   ```typescript
   Request: {
     action: 'respond-to-match',
     matchId: number,
     userId: string,
     accept: boolean
   }
   ```

---

## User Flow

### 1. **Solo Attendee Joins Event**
```
User navigates to event page
↓
Clicks "Join Event"
↓
Added to event_attendees
↓
JoinEventButton triggers buddy matching API
```

### 2. **Buddy Matching Algorithm Runs**
```
API finds all other attendees at the same event
↓
Fetches profiles with interests, age, preferences
↓
Calculates compatibility with each potential match
↓
Creates buddy_matches records for top 3 candidates
↓
Returns matches to frontend
```

### 3. **User Sees Matching Suggestions**
```
BuddyMatchingCard appears in sidebar on event page
↓
Shows first match with compatibility score
↓
User can Accept or Decline
↓
Navigation buttons to view other matches
```

### 4. **Match Resolution**
```
Both users accept → status: 'accepted'
↓
Meeting time is set (30 mins before event)
↓
Users can see each other's profiles and contact info
↓
They meet at the location before the event
```

---

## Integration Points

### 1. Event Detail Page
**File:** `src/app/events/[id]/page.tsx`

The `BuddyMatchingCard` component is displayed in the event sidebar if:
- User is logged in
- Event is not cancelled
- User has joined the event

```tsx
{!event.is_cancelled && user && (
  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
    <BuddyMatchingCard eventId={event.id} userId={user.id} />
  </div>
)}
```

### 2. Join Event Button
**File:** `src/components/JoinEventButton.tsx`

When a user joins an event, buddy matching is automatically triggered:

```typescript
// Trigger buddy matching for this event
try {
  await fetch('/api/buddy-matching', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'find-matches',
      eventId,
      userId: user.id
    })
  })
} catch (err) {
  console.error('Error triggering buddy matching:', err)
}
```

### 3. Navigation Menu
**File:** `src/components/Navigation.tsx`

Added "🤝 Buddies" link visible only to logged-in users:
```tsx
{user && (
  <Link href="/buddy-matches" className="...">
    🤝 Buddies
  </Link>
)}
```

---

## Testing Checklist

### Unit Testing

- [ ] `calculateBuddyCompatibility()` returns 0-100 scores
- [ ] Interest matching correctly identifies shared interests
- [ ] Age compatibility degrades appropriately with age gaps
- [ ] Gender preference filtering works correctly
- [ ] Preference validation rejects incompatible users

### Integration Testing

- [ ] User A joins event → matches generated
- [ ] User A accepts match → User B gets notification
- [ ] Both users accept → match status changes to 'accepted'
- [ ] User declines match → match status changes to 'declined'
- [ ] Buddy matches page shows all matches organized by status
- [ ] Multiple matches → user can navigate through all options

### End-to-End Testing

- [ ] Create two test accounts with similar interests
- [ ] Both join same event at different times
- [ ] Verify buddy match appears for first user
- [ ] Accept match
- [ ] Verify second user sees the accepted match
- [ ] Check /buddy-matches page shows both users
- [ ] Verify meeting time is 30 mins before event

### Edge Cases

- [ ] User joins event, no other attendees yet → no matches shown
- [ ] User A joins, then User B joins 5 mins later → User B gets match suggestion
- [ ] User joins multiple events → matches independent per event
- [ ] Declining a match → other matches still available
- [ ] Both users decline → no notification spam

---

## Future Enhancements

### Phase 2: Enhanced Matching

1. **Machine Learning Integration**
   - Learn from match outcomes (did they actually show up?)
   - Improve compatibility scoring over time
   - Personalized matching based on user behavior

2. **Advanced Preferences**
   - "I prefer native English speakers"
   - "First-time to city events"
   - "Looking for same gender buddy" vs "Any gender"

3. **Group Matching**
   - Match groups of 3-4 people instead of pairs
   - "Buddy trios" for extra confidence

### Phase 3: Post-Event Features

1. **Buddy Rating System**
   - Rate your buddy after the event (1-5 stars)
   - Comments: "Great conversation!", "We clicked!"
   - Improves future matching

2. **Repeat Buddy Feature**
   - "Match me with [username] again"
   - Track "buddy streaks" - number of events attended with same buddy

3. **Buddy History**
   - See all past buddies
   - "Friends made through OpenOutings" badge on profiles

### Phase 4: Social Features

1. **Buddy Messaging**
   - Direct messaging before the event
   - "See you at the entrance!" conversations
   - Plan what to wear, where to meet exactly

2. **Buddy Following**
   - Option to follow your buddy after event
   - See their future event attendance
   - Suggest other events they're interested in

---

## Privacy & Safety Considerations

### Current Protections

1. **RLS Policies**: Each user can only see their own buddy matches
2. **Preference Respect**: Gender preferences and age ranges are honored
3. **Opt-in**: Users can disable buddy matching in preferences
4. **Anonymity Option**: Option to hide profile info before accepting match (future)

### Safety Best Practices

- ✅ Matches are optional - users can always decline
- ✅ Users see full profiles before deciding
- ✅ Report system can flag problematic matches
- ✅ Profile verification encouraged (QR check-ins)

### Data Privacy

- Birth years are stored separately from main profile
- Gender preferences are optional
- Match data is encrypted at rest
- No data shared with third parties

---

## Performance Considerations

### Database Optimization

- **Indexes** on `user_id_1`, `user_id_2`, `event_id`, `status`
- **Partition** `buddy_matches` by event_id for large datasets
- **Archive** old matches (6+ months) to separate table

### API Performance

- Matching algorithm runs in ~100-500ms for typical events
- Top 3 matches returned (not all possible matches)
- Results cached for 5 minutes per event
- Batch processing for large events (100+ people)

### Frontend Optimization

- Lazy load BuddyMatchingCard (not shown immediately)
- Pagination for users with 50+ matches
- Debounce navigation buttons to prevent rapid clicking

---

## Troubleshooting

### Common Issues

**"No buddy matches shown"**
- Check: Is the user logged in?
- Check: Have other people joined this event?
- Check: Is user's `match_enabled` set to true?
- Check: Do they have interests set?

**"Same person keeps appearing"**
- Possible: Only 1-2 other people at event
- Expected behavior: Show best available match
- Solution: Wait for more people to join

**"Buddy match but no meeting time"**
- Bug: Meeting time should be set automatically
- Fix: Run migration 20250122_add_buddy_matching.sql

---

## Configuration

### Environment Variables
No additional env vars required. Uses existing `NEXT_PUBLIC_SUPABASE_*` keys.

### Feature Flags
To disable buddy matching temporarily:
```typescript
// In src/lib/featureFlags.ts
BUDDY_MATCHING_ENABLED: false
```

### Compatibility Threshold
Adjust minimum match score in `/api/buddy-matching`:
```typescript
minCompatibilityThreshold = 50 // default
// Lower = more matches shown, even if less compatible
// Higher = only best matches shown
```

---

## Database Migration

Run this migration in Supabase to enable buddy matching:

```bash
supabase db push supabase/migrations/20250122_add_buddy_matching.sql
```

Or manually execute the SQL in the Supabase dashboard:
- Settings → SQL Editor
- New Query
- Paste content from migration file
- Run Query

---

## Questions?

Refer to the implementation comments in:
- `src/lib/buddyMatching.ts` - Matching algorithm
- `src/components/BuddyMatchingCard.tsx` - UI component
- `src/app/api/buddy-matching/route.ts` - API logic
- `src/app/buddy-matches/page.tsx` - Management page

