import { UserForMatching, PotentialMatch, BuddyPreferences } from './types/buddyMatching'

export interface MatchingWeights {
  interests: number
  ageCompatibility: number
  genderPreference: number
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  interests: 50, // 50 points for interests
  ageCompatibility: 30, // 30 points for age compatibility
  genderPreference: 20, // 20 points for gender preference match
}

/**
 * Calculate compatibility score between two users based on shared interests
 */
export function calculateInterestCompatibility(
  user1Interests: string[],
  user2Interests: string[],
  weight: number
): number {
  if (user1Interests.length === 0 || user2Interests.length === 0) return 0

  const sharedInterests = user1Interests.filter((interest) =>
    user2Interests.includes(interest)
  )

  // Calculate Jaccard similarity (intersection / union)
  const union = new Set([...user1Interests, ...user2Interests])
  const similarity = sharedInterests.length / union.size

  return similarity * weight
}

/**
 * Calculate age compatibility score based on preferences
 */
export function calculateAgeCompatibility(
  user1Age: number | null,
  user2Age: number | null,
  user1Preferences: BuddyPreferences | null,
  user2Preferences: BuddyPreferences | null,
  weight: number
): number {
  // If either user doesn't have age data, return neutral score
  if (!user1Age || !user2Age) return weight * 0.5

  let score = 0
  let checks = 0

  // Check if user2 age fits user1's preferences
  if (user1Preferences?.preferred_age_min || user1Preferences?.preferred_age_max) {
    checks++
    const minAge = user1Preferences.preferred_age_min || 18
    const maxAge = user1Preferences.preferred_age_max || 100

    if (user2Age >= minAge && user2Age <= maxAge) {
      score += 1
    }
  }

  // Check if user1 age fits user2's preferences
  if (user2Preferences?.preferred_age_min || user2Preferences?.preferred_age_max) {
    checks++
    const minAge = user2Preferences.preferred_age_min || 18
    const maxAge = user2Preferences.preferred_age_max || 100

    if (user1Age >= minAge && user1Age <= maxAge) {
      score += 1
    }
  }

  // If no preferences set, return neutral score
  if (checks === 0) return weight * 0.7

  // Return proportional score
  return (score / checks) * weight
}

/**
 * Calculate gender preference compatibility
 */
export function calculateGenderCompatibility(
  user1Gender: string | null,
  user2Gender: string | null,
  user1Preferences: BuddyPreferences | null,
  user2Preferences: BuddyPreferences | null,
  weight: number
): number {
  let score = 0
  let checks = 0

  // Check if user2 gender matches user1's preference
  if (user1Preferences?.preferred_gender && user1Preferences.preferred_gender !== 'any') {
    checks++
    if (user2Gender && user2Gender.toLowerCase() === user1Preferences.preferred_gender.toLowerCase()) {
      score += 1
    }
  }

  // Check if user1 gender matches user2's preference
  if (user2Preferences?.preferred_gender && user2Preferences.preferred_gender !== 'any') {
    checks++
    if (user1Gender && user1Gender.toLowerCase() === user2Preferences.preferred_gender.toLowerCase()) {
      score += 1
    }
  }

  // If no specific preferences or 'any', return full score
  if (checks === 0) return weight

  // Return proportional score
  return (score / checks) * weight
}

/**
 * Calculate overall compatibility score between two users
 */
export function calculateCompatibilityScore(
  user1: UserForMatching,
  user2: UserForMatching,
  weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS
): number {
  const interestScore = calculateInterestCompatibility(
    user1.interests,
    user2.interests,
    weights.interests
  )

  const ageScore = calculateAgeCompatibility(
    user1.age,
    user2.age,
    user1.preferences,
    user2.preferences,
    weights.ageCompatibility
  )

  const genderScore = calculateGenderCompatibility(
    user1.gender,
    user2.gender,
    user1.preferences,
    user2.preferences,
    weights.genderPreference
  )

  return interestScore + ageScore + genderScore
}

/**
 * Get human-readable reasons for why two users are compatible
 */
export function getCompatibilityReasons(
  user1: UserForMatching,
  user2: UserForMatching
): string[] {
  const reasons: string[] = []

  // Shared interests
  const sharedInterests = user1.interests.filter((interest) =>
    user2.interests.includes(interest)
  )

  if (sharedInterests.length > 0) {
    const interestList = sharedInterests.slice(0, 3).join(', ')
    reasons.push(`Shared interests: ${interestList}`)
  }

  // Age compatibility
  if (user1.age && user2.age) {
    const ageDiff = Math.abs(user1.age - user2.age)
    if (ageDiff <= 5) {
      reasons.push('Similar age')
    }
  }

  // Gender preference match
  if (user1.preferences?.preferred_gender && user1.preferences.preferred_gender !== 'any') {
    if (user2.gender?.toLowerCase() === user1.preferences.preferred_gender.toLowerCase()) {
      reasons.push('Matches your gender preference')
    }
  }

  return reasons.length > 0 ? reasons : ['Potential match based on profile']
}

/**
 * Filter users based on mutual preferences
 */
export function filterByPreferences(
  currentUser: UserForMatching,
  potentialMatches: UserForMatching[]
): UserForMatching[] {
  return potentialMatches.filter((candidate) => {
    // Skip if either user has matching disabled
    if (currentUser.preferences?.enabled === false || candidate.preferences?.enabled === false) {
      return false
    }

    // Filter by age preferences
    if (currentUser.age && candidate.preferences?.preferred_age_min && candidate.preferences?.preferred_age_max) {
      if (currentUser.age < candidate.preferences.preferred_age_min || currentUser.age > candidate.preferences.preferred_age_max) {
        return false
      }
    }

    if (candidate.age && currentUser.preferences?.preferred_age_min && currentUser.preferences?.preferred_age_max) {
      if (candidate.age < currentUser.preferences.preferred_age_min || candidate.age > currentUser.preferences.preferred_age_max) {
        return false
      }
    }

    return true
  })
}

/**
 * Find and rank potential buddy matches for a user
 */
export function findPotentialMatches(
  currentUser: UserForMatching,
  allUsers: UserForMatching[],
  weights: MatchingWeights = DEFAULT_MATCHING_WEIGHTS
): PotentialMatch[] {
  // Filter out current user and apply preference filters
  const candidates = allUsers.filter((user) => user.id !== currentUser.id)
  const filteredCandidates = filterByPreferences(currentUser, candidates)

  // Calculate compatibility scores
  const matches: PotentialMatch[] = filteredCandidates.map((candidate) => ({
    user: candidate,
    compatibility_score: calculateCompatibilityScore(currentUser, candidate, weights),
    reasons: getCompatibilityReasons(currentUser, candidate),
  }))

  // Sort by compatibility score (highest first)
  return matches.sort((a, b) => b.compatibility_score - a.compatibility_score)
}
