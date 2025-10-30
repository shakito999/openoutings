"use client"
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSearchParams, useRouter } from 'next/navigation'
import { getApproxLocation } from '@/lib/geo'
import { getEmojiForEvent } from '@/lib/eventIcons'

const MapContainer: any = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false }) as any
const TileLayer: any = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false }) as any
const Marker: any = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false }) as any
const Tooltip: any = dynamic(() => import('react-leaflet').then(m => m.Tooltip), { ssr: false }) as any
const Circle: any = dynamic(() => import('react-leaflet').then(m => m.Circle), { ssr: false }) as any
const Popup: any = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false }) as any
const CircleMarker: any = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false }) as any

// Fix default icon if anything uses it (safety)
if (typeof window !== 'undefined') {
  const L = require('leaflet')
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

function kmToBounds(center: { lat: number; lng: number }, radiusKm: number) {
  const latDelta = radiusKm / 111 // ~km per deg latitude
  const lngDelta = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180) || 1)
  const south = center.lat - latDelta
  const north = center.lat + latDelta
  const west = center.lng - lngDelta
  const east = center.lng + lngDelta
  return [[south, west], [north, east]] as [[number, number], [number, number]]
}

function createEmojiIcon(emoji: string) {
  if (typeof window === 'undefined') return undefined
  const L = require('leaflet') as typeof import('leaflet')
  return L.divIcon({
    className: 'oo-emoji-pin',
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:16px;background:#111827;color:#fff;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid #fff">
        <span>${emoji}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    tooltipAnchor: [16, -16]
  })
}

function createHeadingIcon(deg: number) {
  if (typeof window === 'undefined') return undefined
  const L = require('leaflet') as typeof import('leaflet')
  // Simple triangular arrow pointing up (north), rotated by heading degrees
  const html = `
    <div style="width:24px;height:24px;transform:rotate(${deg}deg);transform-origin:center center;">
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,.35))">
        <path d="M12 3 L7 15 L12 12 L17 15 Z" fill="#1D4ED8" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" />
      </svg>
    </div>
  `
  return L.divIcon({ className: 'oo-heading-arrow', html, iconSize: [24, 24], iconAnchor: [12, 12] })
}

interface EventsMapViewProps {
  events: any[]
}

export default function EventsMapView({ events }: EventsMapViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [center, setCenter] = useState<LatLngExpression | null>(null)
  const [zoom, setZoom] = useState<number>(13)
  const [showLabels, setShowLabels] = useState(false)
  const [tiles] = useState(() => ({
    url: process.env.NEXT_PUBLIC_MAP_TILES_URL!,
    attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION!,
  }))
  const mapRef = useRef<any>(null)
const [selectedId, setSelectedId] = useState<number | null>(null)

  const radiusParam = searchParams.get('distance')
  const radiusKm = radiusParam ? Math.max(1, parseInt(radiusParam)) : 10

  // User location state
  const [myPos, setMyPos] = useState<LatLngExpression | null>(null)
  const [myAcc, setMyAcc] = useState<number | null>(null)
  const [heading, setHeading] = useState<number | null>(null)
  const mapKeyRef = useRef<string | null>(null)
  if (!mapKeyRef.current) mapKeyRef.current = 'map-' + Math.random().toString(36).slice(2)

  // Initialize center via geolocation/IP fallback
  useEffect(() => {
    let mounted = true
    getApproxLocation().then((loc) => {
      if (!mounted) return
      if (loc) {
        setCenter([loc.latitude, loc.longitude])
      } else {
        // Fallback: center on first event with location or Sofia
        const firstWithCoords = events.find(e => e.lat && e.lng)
        if (firstWithCoords) setCenter([firstWithCoords.lat, firstWithCoords.lng])
        else setCenter([42.6977, 23.3219]) // Sofia
      }
    })
    return () => { mounted = false }
  }, [events])

  // Try live precise geolocation for blue dot (optional, falls back silently)
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return
    let watchId: number | null = null
    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, heading: h } = pos.coords as GeolocationCoordinates & { heading?: number | null }
          const loc: LatLngExpression = [latitude, longitude]
          setMyPos(loc)
          setMyAcc(Number.isFinite(accuracy as number) ? (accuracy as number) : null)
          if (typeof h === 'number' && !Number.isNaN(h)) setHeading(h)
        },
        () => {
          // ignore errors; we just won't show the blue dot
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      ) as unknown as number
    } catch {}
    return () => {
      if (watchId !== null) {
        try { navigator.geolocation.clearWatch(watchId as unknown as number) } catch {}
      }
    }
  }, [])

  // Fit to radius once map and center are ready
  useEffect(() => {
    if (!center || !mapRef.current) return
    const map = mapRef.current
    // Fit bounds so that diameter=2*radius is visible
    const c = Array.isArray(center) ? { lat: center[0] as number, lng: center[1] as number } : (center as any)
    const bounds = kmToBounds(c, radiusKm)
    try {
      map.fitBounds(bounds, { padding: [30, 30] })
    } catch {}
  }, [center, radiusKm])

  const handleZoomEnd = () => {
    if (!mapRef.current) return
    const z = mapRef.current.getZoom()
    setZoom(z)
    setShowLabels(z >= 14)
  }

  const handleMarkerClick = (eventId: number) => {
    if (selectedId === eventId) {
      router.push(`/events/${eventId}`)
    } else {
      setSelectedId(eventId)
    }
  }

  const eventMarkers = useMemo(() => {
    return events
      .filter((e) => e.lat && e.lng)
      .map((e) => {
        const emoji = getEmojiForEvent(e)
        const icon = createEmojiIcon(emoji)
        const title: string = e.title || 'Event'
        const when = e.starts_at ? new Date(e.starts_at).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : ''
        return { id: e.id as number, pos: [e.lat, e.lng] as LatLngExpression, icon, title, when, event: e }
      })
  }, [events])

  return (
    <div className="h-[70vh] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative">
      {/* Controls overlay (ensure above Leaflet popups/markers) */}
      <div className="absolute right-3 bottom-3 z-[1000] flex flex-col gap-2 pointer-events-none">
        <button
          type="button"
          onClick={() => { if (mapRef.current && myPos) mapRef.current.setView(myPos as any, mapRef.current.getZoom() ?? 15, { animate: true }) }}
          disabled={!myPos}
          aria-label="Recenter to my location"
          title="Recenter to my location"
          className="pointer-events-auto bg-white/95 dark:bg-gray-900/90 backdrop-blur px-3 py-2 rounded-full shadow border border-gray-200 dark:border-gray-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <circle cx="12" cy="12" r="5" />
            </svg>
            <span className="hidden sm:inline">My location</span>
          </span>
        </button>
      </div>

      {center && (
        <MapContainer
          key={mapKeyRef.current!}
          id={mapKeyRef.current!}
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          whenReady={(e: any) => {
            const m = e?.target
            if (m) {
              mapRef.current = m
              m.on('zoomend', handleZoomEnd)
              const z = m.getZoom?.() ?? zoom
              setShowLabels(z >= 14)
            }
          }}
        >
          <TileLayer url={tiles.url} attribution={tiles.attribution} />
          {/* Radius indicator */}
          {Array.isArray(center) && (
            <Circle center={center as any} radius={radiusKm * 1000} pathOptions={{ color: '#3B82F6', opacity: 0.2, fillColor: '#3B82F6', fillOpacity: 0.08 }} />
          )}

          {/* My location: blue dot + accuracy ring */}
          {myPos && (
            <>
              {myAcc && (
                <Circle center={myPos as any} radius={Math.min(myAcc, 800)} pathOptions={{ color: '#2563EB', opacity: 0.2, fillColor: '#3B82F6', fillOpacity: 0.08 }} />
              )}
              <CircleMarker center={myPos as any} radius={6} pathOptions={{ color: '#1D4ED8', weight: 2, fillColor: '#3B82F6', fillOpacity: 1 }} />
              {heading !== null && (
                <Marker position={myPos as any} icon={createHeadingIcon(heading)!} interactive={false} />
              )}
            </>
          )}

          {eventMarkers.map(m => (
            <Marker key={m.id} position={m.pos} icon={m.icon} eventHandlers={{ click: () => handleMarkerClick(m.id) }}>
              <Tooltip direction="top" offset={[0, -24]} opacity={1} permanent={showLabels} className="!bg-white !text-gray-800 !rounded-full !px-3 !py-1 !border !border-gray-200 !shadow">
                <div className="text-xs font-medium">
                  {m.title.length > 40 ? m.title.slice(0, 40) + '…' : m.title}
                </div>
                <div className="text-[10px] text-gray-500">{m.when}</div>
              </Tooltip>
              <Popup offset={[0, -16]} autoPan={true} closeButton={false} className="oo-clean-popup">
                <div className="w-72 sm:w-80 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* Image */}
                  <div className="h-40 relative overflow-hidden">
                    <img
                      src={m.event?.event_photos?.[0]?.storage_path || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800'}
                      alt={m.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium">
                      {m.event?.starts_at ? new Date(m.event.starts_at).toLocaleDateString('bg-BG', { month: 'short', day: 'numeric' }) : ''}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {m.title}
                    </h3>

                    {/* Time */}
                    {m.event?.starts_at && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(m.event.starts_at).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                      </div>
                    )}

                    {/* Location */}
                    {m.event?.address && (
                      <div className="flex items-start text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-2">{m.event.address}</span>
                      </div>
                    )}

                    {/* Interests */}
                    {m.event?.event_interests && m.event.event_interests.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {m.event.event_interests.slice(0, 3).map((ei: any, idx: number) => (
                            <span
                              key={ei.interest_id || idx}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                            >
                              {ei.interests?.name}
                            </span>
                          ))}
                          {m.event.event_interests.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">
                              +{m.event.event_interests.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <button onClick={() => router.push(`/events/${m.id}`)} className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium">
                      View details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
      {!center && (
        <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          Loading map…
        </div>
      )}
    </div>
  )
}
