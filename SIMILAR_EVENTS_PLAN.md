# Similar Events Section - Implementation Plan

## 🎯 Goal
Add a "Similar Events" section to the event detail page that shows related events based on:
1. **Shared interests** (primary)
2. **Location proximity** (secondary)
3. **Similar timing** (tertiary)

---

## 📊 Algorithm Design

### Scoring System
Each event gets a similarity score based on:

```
Total Score = (Interest Match × 5) + (Location Score × 3) + (Time Score × 2)
```

#### 1. Interest Match Score (Weight: 5)
- Count shared interests between current event and candidate event
- Score = (number of shared interests / total interests of current event) × 5
- If current event has no interests, use all events

#### 2. Location Score (Weight: 3)
- If both events have lat/lng coordinates:
  - Within 5km: Score = 3
  - Within 10km: Score = 2
  - Within 25km: Score = 1
  - Beyond 25km: Score = 0
- If either event lacks coordinates: Score = 0.5 (neutral)

#### 3. Time Score (Weight: 2)
- Events within next 7 days: Score = 2
- Events within next 30 days: Score = 1
- Events beyond 30 days: Score = 0.5

### Filtering Rules
- Exclude the current event itself
- Exclude cancelled events
- Exclude past events (starts_at < now)
- Exclude events at full capacity (optional)
- Limit to top 3-6 results

---

## 🗄️ Database Strategy

### Option A: Simple (Start Here) ✅
Fetch events client-side and calculate similarity in JavaScript:

```typescript
// Fetch current event's interests
const currentInterests = await supabase
  .from('event_interests')
  .select('interest_id')
  .eq('event_id', currentEventId)

// Fetch all upcoming events with their interests
const { data: events } = await supabase
  .from('events')
  .select(`
    *,
    event_interests(interest_id),
    event_attendees(user_id)
  `)
  .gte('starts_at', new Date().toISOString())
  .eq('is_cancelled', false)
  .neq('id', currentEventId)
  .limit(20)

// Calculate scores in JS and sort
const scoredEvents = events.map(e => ({
  ...e,
  score: calculateSimilarity(currentEvent, e)
})).sort((a, b) => b.score - a.score)

return scoredEvents.slice(0, 6)
```

**Pros:**
- Simple to implement
- No database changes needed
- Easy to iterate on algorithm

**Cons:**
- Slightly slower for large datasets
- More client-side processing

### Option B: Database Function (Future Optimization)
Create a PostgreSQL function to calculate similarity:

```sql
CREATE FUNCTION get_similar_events(
  p_event_id bigint,
  p_limit int DEFAULT 6
) RETURNS TABLE (
  event_id bigint,
  similarity_score float
) AS $$
  -- Complex SQL with scoring logic
$$ LANGUAGE sql;
```

**Pros:**
- Faster queries
- Less data transfer
- Scalable

**Cons:**
- More complex to build
- Harder to debug/modify

---

## 🏗️ Implementation Steps

### Step 1: Create SimilarEvents Component
**File:** `src/components/SimilarEvents.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import EventCard from './EventCard'
import { createBrowserSupabase } from '@/lib/supabaseClient'

interface SimilarEventsProps {
  currentEvent: {
    id: number
    interests: string[]
    lat?: number
    lng?: number
    starts_at: string
  }
}

export default function SimilarEvents({ currentEvent }: SimilarEventsProps) {
  const [similarEvents, setSimilarEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSimilar() {
      // Implementation here
    }
    fetchSimilar()
  }, [currentEvent.id])

  if (loading) return <LoadingSkeleton />
  if (similarEvents.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">
        Подобни събития 🎯
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similarEvents.map(event => (
          <EventCard key={event.id} event={event} compact />
        ))}
      </div>
    </section>
  )
}
```

### Step 2: Create Similarity Scoring Utility
**File:** `src/lib/similarityScoring.ts`

```typescript
export interface ScoringWeights {
  interests: number
  location: number
  time: number
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  interests: 5,
  location: 3,
  time: 2,
}

export function calculateInterestScore(
  currentInterests: string[],
  candidateInterests: string[],
  weight: number
): number {
  if (currentInterests.length === 0) return 0
  
  const sharedCount = currentInterests.filter(i => 
    candidateInterests.includes(i)
  ).length
  
  return (sharedCount / currentInterests.length) * weight
}

export function calculateLocationScore(
  currentLat: number | undefined,
  currentLng: number | undefined,
  candidateLat: number | undefined,
  candidateLng: number | undefined,
  weight: number
): number {
  if (!currentLat || !currentLng || !candidateLat || !candidateLng) {
    return 0.5 // Neutral score for missing coords
  }
  
  const distance = haversineDistance(
    currentLat, currentLng,
    candidateLat, candidateLng
  )
  
  if (distance <= 5) return weight
  if (distance <= 10) return weight * 0.66
  if (distance <= 25) return weight * 0.33
  return 0
}

export function calculateTimeScore(
  currentStartsAt: string,
  candidateStartsAt: string,
  weight: number
): number {
  const daysDiff = Math.abs(
    differenceInDays(
      new Date(candidateStartsAt),
      new Date(currentStartsAt)
    )
  )
  
  if (daysDiff <= 7) return weight
  if (daysDiff <= 30) return weight * 0.5
  return weight * 0.25
}

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
```

### Step 3: Add to Event Detail Page
**File:** `src/app/events/[id]/page.tsx`

Add at the bottom before closing `</div>`:

```tsx
{/* Similar Events Section */}
<div className="mt-16 max-w-7xl mx-auto">
  <SimilarEvents 
    currentEvent={{
      id: event.id,
      interests: eventInterests,
      lat: event.lat,
      lng: event.lng,
      starts_at: event.starts_at
    }}
  />
</div>
```

### Step 4: Create Compact EventCard (if needed)
**Option A:** Reuse existing EventCard with `compact` prop
**Option B:** Create new `EventCardCompact.tsx` for similar events

---

## 🎨 UI Design

### Layout Options

#### Option 1: Horizontal Scroll (Mobile-friendly)
```
┌──────────────────────────────────────┐
│  Similar Events 🎯                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ →     │
│  │    │ │    │ │    │ │    │        │
│  └────┘ └────┘ └────┘ └────┘        │
└──────────────────────────────────────┘
```

#### Option 2: Grid (Desktop-focused) ✅
```
┌──────────────────────────────────────┐
│  Similar Events 🎯                   │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │        │ │        │ │        │   │
│  └────────┘ └────────┘ └────────┘   │
└──────────────────────────────────────┘
```

### Card Content
- Event photo (small)
- Title
- Date badge
- Location (if available)
- Shared interests badges (highlight)
- Attendee count
- "Similarity: ⭐⭐⭐" indicator (optional)

---

## 🚀 Rollout Strategy

### Phase 1: MVP (Day 1-2)
- ✅ Simple interest-based matching only
- ✅ Show top 3 events
- ✅ Basic card design
- ✅ Client-side scoring

### Phase 2: Enhanced (Day 3-4)
- ✅ Add location scoring
- ✅ Add time scoring
- ✅ Show top 6 events
- ✅ Add "Why Similar" tooltip
- ✅ Loading states

### Phase 3: Optimization (Future)
- 🔄 Database function for scoring
- 🔄 Caching similar events
- 🔄 A/B test scoring weights
- 🔄 Machine learning recommendations

---

## 📈 Success Metrics

Track these to measure effectiveness:
1. **Click-through rate** on similar events
2. **Conversion rate** (view → join)
3. **Session length** increase
4. **Event discovery** rate

---

## 🧪 Testing Checklist

- [ ] Events with shared interests show up
- [ ] Events without interests still show some results
- [ ] Current event is excluded
- [ ] Cancelled events are excluded
- [ ] Past events are excluded
- [ ] Works with 0 similar events found
- [ ] Loading state displays properly
- [ ] Mobile responsive
- [ ] Dark mode compatible

---

## 🔧 Configuration Options

Add to `src/lib/config.ts`:

```typescript
export const SIMILAR_EVENTS_CONFIG = {
  maxResults: 6,
  weights: {
    interests: 5,
    location: 3,
    time: 2,
  },
  filters: {
    excludeCancelled: true,
    excludePast: true,
    excludeFull: false, // Set to true to hide full events
    maxDaysInFuture: 90, // Only show events within 90 days
  },
  locationThresholds: {
    close: 5, // km
    nearby: 10,
    region: 25,
  }
}
```

---

## 💡 Future Enhancements

1. **User-based recommendations**
   - "Events from hosts you follow"
   - "Events your friends joined"

2. **Behavioral tracking**
   - Learn from user's event browsing patterns
   - Track which similar events get clicked

3. **Smart ordering**
   - Boost events with high attendance rate
   - Boost events from verified hosts
   - Boost events with good reviews

4. **Dynamic scoring**
   - Adjust weights based on user preferences
   - Time-of-day preference matching
   - Event type clustering

5. **UI enhancements**
   - "Because you're interested in X" labels
   - Animated transitions
   - "Save for later" quick action

---

## 📝 Notes

- Start simple with Option A (client-side)
- Can always optimize to Option B later
- Keep the scoring algorithm tunable
- Monitor performance with large datasets
- Consider adding analytics tracking
