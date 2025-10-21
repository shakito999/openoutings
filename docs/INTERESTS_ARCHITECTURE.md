# Interests Architecture

## Single Source of Truth

All interests are now managed through **one place** to avoid duplication and maintenance issues.

## File Structure

### 1. `interestsBilingual.ts` - Base Data
- Contains `BILINGUAL_INTERESTS` array with Bulgarian/English translations
- This is where you **add or remove interests**
- Includes helper functions:
  - `getInterestDisplay()` - Get translated display name
  - `searchInterests()` - Search across both languages

### 2. `interestGroups.ts` - Organization & Grouping
- Imports from `interestsBilingual.ts`
- Groups interests into logical categories (Outdoor, Sports, Games, etc.)
- **This is where you organize interests into groups**
- Exports:
  - `INTEREST_GROUPS` - Array of grouped categories
  - `INTERESTS` - Flattened list (auto-generated from groups)
  - Helper functions for group operations

## How to Add a New Interest

1. **Add to `interestsBilingual.ts`:**
```typescript
{ bg: 'Шах', en: 'Chess', canonical: 'Шах' }
```

2. **Add to appropriate group in `interestGroups.ts`:**
```typescript
{
  id: 'games',
  bg: 'Игри и социални',
  en: 'Games & Social',
  emoji: '🎲',
  interests: [
    'Настолни игри',
    'Игри на карти',
    'Белот',
    'Покер',
    'Шах',  // <-- Add here
    // ...
  ]
}
```

That's it! The interest will automatically appear everywhere.

## How to Remove an Interest

1. Remove from `BILINGUAL_INTERESTS` in `interestsBilingual.ts`
2. Remove from the group in `interestGroups.ts`

## Import Guide

### For filters/UI components:
```typescript
import { INTEREST_GROUPS } from '@/lib/interestGroups'
import { getInterestDisplay } from '@/lib/interestsBilingual'
```

### For simple interest lists:
```typescript
import { INTERESTS } from '@/lib/interestGroups'
import { getInterestDisplay } from '@/lib/interestsBilingual'
```

### For translations only:
```typescript
import { getInterestDisplay, searchInterests } from '@/lib/interestsBilingual'
```

## Why This Structure?

- ✅ **Single source of truth** - Add/remove in one place
- ✅ **Automatic propagation** - Changes appear everywhere
- ✅ **Organized UI** - Groups make filtering easier
- ✅ **Maintainable** - No duplication, clear separation of concerns
- ✅ **Bilingual** - Built-in Bulgarian/English support

## Current Groups

1. 🏔️ Outdoor & Adventure
2. ⛷️ Winter Sports
3. 💪 Fitness & Training
4. ⚽ Team Sports
5. 💃 Dance & Movement
6. 🎨 Arts & Creativity
7. 🎵 Music & Performance
8. 🎭 Culture & Entertainment
9. 🍷 Food & Drink
10. 🎲 Games & Social
11. 🗺️ Travel & Places
12. 🧘 Wellness & Health
13. 🐕 Animals & Pets
14. 📚 Learning & Development
15. 💻 Tech & Innovation
16. 🤝 Professional & Networking
