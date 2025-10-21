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

export interface EventForScoring {
  id: number
  interests: string[]
  lat?: number | null
  lng?: number | null
  starts_at: string
}

/**
 * Calculate similarity score based on shared interests
 */
export function calculateInterestScore(
  currentInterests: string[],
  candidateInterests: string[],
  weight: number
): number {
  if (currentInterests.length === 0) return 0
  
  const sharedCount = currentInterests.filter(interest => 
    candidateInterests.includes(interest)
  ).length
  
  return (sharedCount / currentInterests.length) * weight
}

/**
 * Calculate similarity score based on location proximity
 */
export function calculateLocationScore(
  currentLat: number | null | undefined,
  currentLng: number | null | undefined,
  candidateLat: number | null | undefined,
  candidateLng: number | null | undefined,
  weight: number
): number {
  // If either event lacks coordinates, return neutral score
  if (!currentLat || !currentLng || !candidateLat || !candidateLng) {
    return 0.5
  }
  
  const distance = haversineDistance(
    currentLat, currentLng,
    candidateLat, candidateLng
  )
  
  // Score based on distance thresholds
  if (distance <= 5) return weight // Within 5km: full score
  if (distance <= 10) return weight * 0.66 // Within 10km: 66%
  if (distance <= 25) return weight * 0.33 // Within 25km: 33%
  return 0 // Beyond 25km: no score
}

/**
 * Calculate similarity score based on time proximity
 */
export function calculateTimeScore(
  currentStartsAt: string,
  candidateStartsAt: string,
  weight: number
): number {
  const currentDate = new Date(currentStartsAt)
  const candidateDate = new Date(candidateStartsAt)
  
  const daysDiff = Math.abs(
    Math.floor((candidateDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
  )
  
  // Score based on days difference
  if (daysDiff <= 7) return weight // Within 7 days: full score
  if (daysDiff <= 30) return weight * 0.5 // Within 30 days: 50%
  return weight * 0.25 // Beyond 30 days: 25%
}

/**
 * Calculate total similarity score for a candidate event
 */
export function calculateSimilarityScore(
  currentEvent: EventForScoring,
  candidateEvent: EventForScoring,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const interestScore = calculateInterestScore(
    currentEvent.interests,
    candidateEvent.interests,
    weights.interests
  )
  
  const locationScore = calculateLocationScore(
    currentEvent.lat,
    currentEvent.lng,
    candidateEvent.lat,
    candidateEvent.lng,
    weights.location
  )
  
  const timeScore = calculateTimeScore(
    currentEvent.starts_at,
    candidateEvent.starts_at,
    weights.time
  )
  
  return interestScore + locationScore + timeScore
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Get a human-readable explanation of why events are similar
 */
export function getSimilarityReason(
  currentEvent: EventForScoring,
  candidateEvent: EventForScoring
): string {
  const reasons: string[] = []
  
  // Check for shared interests
  const sharedInterests = currentEvent.interests.filter(interest =>
    candidateEvent.interests.includes(interest)
  )
  
  if (sharedInterests.length > 0) {
    reasons.push(`Shared interests: ${sharedInterests.slice(0, 2).join(', ')}`)
  }
  
  // Check for location proximity
  if (currentEvent.lat && currentEvent.lng && candidateEvent.lat && candidateEvent.lng) {
    const distance = haversineDistance(
      currentEvent.lat,
      currentEvent.lng,
      candidateEvent.lat,
      candidateEvent.lng
    )
    
    if (distance <= 5) {
      reasons.push('Very close by')
    } else if (distance <= 10) {
      reasons.push('Nearby location')
    } else if (distance <= 25) {
      reasons.push('In your area')
    }
  }
  
  // Check for time proximity
  const daysDiff = Math.abs(
    Math.floor((new Date(candidateEvent.starts_at).getTime() - new Date(currentEvent.starts_at).getTime()) / (1000 * 60 * 60 * 24))
  )
  
  if (daysDiff <= 7) {
    reasons.push('Around the same time')
  }
  
  return reasons.length > 0 ? reasons.join(' • ') : 'Recommended for you'
}
