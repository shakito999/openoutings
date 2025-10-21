/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`
  }
  return `${km.toFixed(1)}km away`
}

/**
 * Get user's current location
 * @returns Promise with coordinates or null if denied/unavailable
 */
export async function getUserLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return null
    }

    // Only proceed if permission is already granted to avoid implicit prompts
    try {
      const navAny = navigator as any
      if (navAny.permissions?.query) {
        const perm: PermissionStatus = await navAny.permissions.query({ name: 'geolocation' as any })
        if (perm.state !== 'granted') {
          return null
        }
      }
    } catch {
      // If Permissions API is unavailable, fall back to attempting only when called from user action
    }

    return await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          // Avoid noisy logs in production; keep it debug-level
          if (typeof console !== 'undefined' && console.debug) {
            console.debug('Geolocation error', { code: (error as any)?.code, message: (error as any)?.message })
          }
          resolve(null)
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      )
    })
  } catch {
    return null
  }
}
