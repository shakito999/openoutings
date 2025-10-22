# 🤝 Buddy Matching - Complete Explanation

## ⚠️ CURRENT STATUS: NOT IMPLEMENTED

**The buddy matching feature does NOT exist in your app right now.** 

We cleaned up a broken implementation and laid the groundwork for building it properly in the future.

---

## What You Have NOW (Foundation)

### ✅ Database Fields in `profiles` Table:

```sql
-- Personal information
birth_date DATE          -- User's birth date (optional)
gender TEXT              -- 'male', 'female', 'non-binary', 'other', 'prefer-not-to-say'

-- Privacy settings  
show_age BOOLEAN         -- Whether to display age publicly (default: false)
show_gender BOOLEAN      -- Whether to display gender publicly (default: false)
```

### ✅ Profile Edit Page Features:

1. **Birth Date Picker**
   - Native date input (works on all devices)
   - Optional field
   - Stored in database for future use

2. **Gender Selection**
   - Dropdown with 5 options:
     - Мъж (Male)
     - Жена (Female)
     - Небинарен (Non-binary)
     - Друго (Other)
     - Предпочитам да не казвам (Prefer not to say)

3. **Privacy Toggles** (NEW!)
   - ✅ **"Покажи възраст публично"** - Show age on profile (checkbox appears when birth date is set)
   - ✅ **"Покажи пол публично"** - Show gender on profile (checkbox appears when gender is selected)

### How Privacy Works:

```typescript
// If user has birth_date = "1995-05-15" and show_age = false
// → Age is NOT displayed on profile (private)

// If user has birth_date = "1995-05-15" and show_age = true
// → Age "29" IS displayed on profile (public)

// Same logic for gender
```

---

## What You DON'T Have (Needs to be Built)

### ❌ Buddy Matching System
- No matching algorithm
- No buddy match database tables
- No UI to suggest buddies
- No way to accept/decline matches
- No "Buddies" page
- No API endpoints

---

## How Buddy Matching WOULD Work (Future Design)

When you're ready to build it, here's the recommended approach:

### 1. Database Tables Needed

```sql
-- Main buddy matches table
CREATE TABLE buddy_matches (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT REFERENCES events(id),
  user_id_1 UUID REFERENCES profiles(id),
  user_id_2 UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')),
  compatibility_score NUMERIC(5,2),  -- 0-100 score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id_1, user_id_2)
);

-- User preferences for matching
CREATE TABLE buddy_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  enabled BOOLEAN DEFAULT true,
  preferred_age_min INT,
  preferred_age_max INT,
  preferred_gender TEXT
);
```

### 2. When User Joins Event

```typescript
// After user clicks "Join Event"
1. User added to event_attendees
2. Check if other people attending this event
3. Calculate compatibility with each attendee:
   - Shared interests (40% weight)
   - Age proximity (25% weight)  ← Uses birth_date!
   - Gender compatibility (20% weight)  ← Uses gender!
   - Past event participation (15% weight)
4. Create buddy_matches records for top 2-3 compatible people
5. Show notification: "We found potential buddies for this event!"
```

### 3. Compatibility Algorithm Example

```typescript
function calculateCompatibility(user1: Profile, user2: Profile): number {
  let score = 0;
  
  // Shared interests (40%)
  const sharedInterests = findCommonInterests(user1, user2);
  score += (sharedInterests.length / user1.interests.length) * 40;
  
  // Age proximity (25%)
  if (user1.birth_date && user2.birth_date) {
    const age1 = calculateAge(user1.birth_date);
    const age2 = calculateAge(user2.birth_date);
    const ageDiff = Math.abs(age1 - age2);
    
    if (ageDiff <= 3) score += 25;      // Very close age
    else if (ageDiff <= 5) score += 20;  // Close age
    else if (ageDiff <= 10) score += 15; // Somewhat close
    else score += 5;                      // Different generations
  } else {
    score += 15; // Neutral if age unknown
  }
  
  // Gender compatibility (20%)
  // Check if genders match preferences
  if (checkGenderMatch(user1, user2)) {
    score += 20;
  }
  
  // Event history (15%)
  const commonEvents = countCommonEvents(user1, user2);
  score += Math.min(15, commonEvents * 3);
  
  return score; // 0-100
}
```

### 4. User Flow

```
User → Joins event solo
     ↓
System calculates matches with other solo attendees
     ↓
BuddyMatchingCard shows in event sidebar:
  "🤝 We found potential buddies!"
  
  Card shows:
  - Buddy's name & avatar
  - Compatibility: 78%
  - Shared interests: Yoga, Coffee
  - "Accept" or "Decline" buttons
     ↓
User clicks "Accept"
     ↓
Other user gets notification: "[Name] wants to be your buddy!"
     ↓
Both accept → Match confirmed!
     ↓
Suggestion: "Meet 30 mins before event at [location]"
```

### 5. Components Needed

```
src/components/BuddyMatchingCard.tsx
  - Shows buddy suggestions on event page
  - Accept/Decline buttons
  - Compatibility score display

src/app/buddy-matches/page.tsx
  - Dashboard showing all matches
  - Tabs: Pending, Accepted, Past

src/app/api/buddy-matching/route.ts
  - POST /api/buddy-matching/find - Find matches
  - POST /api/buddy-matching/respond - Accept/Decline
  - GET /api/buddy-matching/list - List user's matches
```

---

## Why Privacy Toggles Matter

### Without Toggles (OLD):
- ❌ User's age always visible if they provide birth date
- ❌ No control over who sees personal info
- ❌ Some users won't provide data due to privacy concerns

### With Toggles (NEW):
- ✅ Age and gender used for **matching algorithm** (backend)
- ✅ User controls if it's shown **publicly** (frontend)
- ✅ More users willing to provide data = better matches
- ✅ Privacy-conscious design

### Example Scenarios:

**Scenario 1: Privacy-conscious user**
- Sets: `birth_date = 1990-01-01`, `show_age = false`
- Result: Age 35 used for matching, but profile shows no age
- Perfect! Gets good matches but maintains privacy

**Scenario 2: Open user**
- Sets: `birth_date = 1995-05-15`, `show_age = true`
- Result: Profile displays "Age: 29"
- Perfect! Public info helps others decide to connect

**Scenario 3: Prefers not to say**
- Sets: `gender = 'prefer-not-to-say'`
- Result: No gender checkbox appears (automatic privacy)
- Perfect! Respects user's preference completely

---

## To Display Age/Gender on Profile Page

You'll need to update `src/app/profile/[id]/page.tsx`:

```typescript
// Fetch profile with new fields
const { data: profile } = await supabase
  .from('profiles')
  .select('*, birth_date, gender, show_age, show_gender')
  .eq('id', id)
  .single()

// Calculate age if birth_date exists
function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// Display on profile (only if show_age is true)
{profile.show_age && profile.birth_date && (
  <div className="flex items-center">
    <span>Age: {calculateAge(profile.birth_date)}</span>
  </div>
)}

// Display gender (only if show_gender is true)
{profile.show_gender && profile.gender && (
  <div className="flex items-center">
    <span>Gender: {profile.gender}</span>
  </div>
)}
```

---

## Summary

### ✅ What Works Now:
1. Users can add birth date in profile edit
2. Users can select gender in profile edit
3. Users can toggle privacy for both (show_age, show_gender)
4. Data stored in database ready for future use

### ❌ What Doesn't Exist Yet:
1. Buddy matching algorithm
2. Buddy match suggestions
3. Accept/decline functionality
4. Buddy matches dashboard
5. Any UI showing matches

### 📋 To Build Buddy Matching:
1. Create database tables (buddy_matches, buddy_preferences)
2. Build matching algorithm using birth_date and gender
3. Create BuddyMatchingCard component
4. Add API endpoints
5. Create /buddy-matches page
6. Integrate with event join flow
7. Add notifications when matches are made

### 🎯 The Foundation is Ready:
- Clean database schema ✅
- Privacy controls ✅
- No TypeScript errors ✅
- User can provide data ✅
- Ready to build matching system when needed ✅

---

## Next Steps

When you want to implement buddy matching:

1. **Read** the `PLATFORM_ANALYSIS_2025.md` for design ideas
2. **Create** the buddy_matches database table
3. **Build** a simple matching algorithm
4. **Test** with 2-3 users attending same event
5. **Iterate** based on user feedback

For now, you have a solid foundation with privacy controls that users will appreciate! 🎉
