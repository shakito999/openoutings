export async function getApproxLocation(): Promise<{ latitude: number; longitude: number } | null> {
  // Try browser geolocation if already granted (handled upstream typically)
  try {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // Best-effort attempt (won't prompt if permissions API blocks us upstream)
      const loc = await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 }
        )
      })
      if (loc) return loc
    }
  } catch {}

  // Fallback to IP-based geolocation (no key)
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (res.ok) {
      const data = await res.json()
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return { latitude: data.latitude, longitude: data.longitude }
      }
    }
  } catch {}

  // Optional: ipinfo.io if token provided
  try {
    const token = process.env.NEXT_PUBLIC_IPINFO_TOKEN
    if (token) {
      const res = await fetch(`https://ipinfo.io/json?token=${token}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.loc && typeof data.loc === 'string') {
          const [latStr, lngStr] = data.loc.split(',')
          const lat = parseFloat(latStr)
          const lng = parseFloat(lngStr)
          if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            return { latitude: lat, longitude: lng }
          }
        }
      }
    }
  } catch {}

  return null
}