"use client"
import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MapContainer: any = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false }) as any
const TileLayer: any = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false }) as any
const Marker: any = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false }) as any

// Fix for default marker icon in Next.js
if (typeof window !== 'undefined') {
  const L = require('leaflet')
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

export default function Map({ center = [51.505, -0.09] as LatLngExpression, onPick, onAddressFound }: { 
  center?: LatLngExpression; 
  onPick?: (lat: number, lng: number) => void;
  onAddressFound?: (address: string) => void;
}) {
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(center)
  const [markerPos, setMarkerPos] = useState<LatLngExpression | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [mapKey, setMapKey] = useState(0)
  
  const tiles = useMemo(() => ({
    url: process.env.NEXT_PUBLIC_MAP_TILES_URL!,
    attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION!,
  }), [])

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await response.json()
      if (data.display_name && onAddressFound) {
        onAddressFound(data.display_name)
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  const handleMapClick = async (e: any) => {
    const lat = e.latlng.lat
    const lng = e.latlng.lng
    setMarkerPos([lat, lng])
    onPick?.(lat, lng)
    await reverseGeocode(lat, lng)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    try {
      // Using Nominatim (OpenStreetMap) for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        const newPos: LatLngExpression = [lat, lng]
        setMarkerPos(newPos)
        setMapCenter(newPos)
        setMapKey(prev => prev + 1) // Remount to recenter
        onPick?.(lat, lng)
        if (data[0].display_name && onAddressFound) {
          onAddressFound(data[0].display_name)
        }
      } else {
        alert('Location not found. Try a different search term.')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Error searching location')
    } finally {
      setSearching(false)
    }
  }

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const newPos: LatLngExpression = [lat, lng]
        setMarkerPos(newPos)
        setMapCenter(newPos)
        setMapKey(prev => prev + 1) // Remount to recenter
        onPick?.(lat, lng)
        await reverseGeocode(lat, lng)
        setGettingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Unable to get your location')
        setGettingLocation(false)
      }
    )
  }

  return (
    <div className="space-y-3">
      {/* Search Controls */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
        <button
          onClick={handleMyLocation}
          disabled={gettingLocation}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
          title="Use my location"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {gettingLocation ? 'Getting...' : 'My Location'}
        </button>
      </div>

      {/* Map */}
      <div className="h-80 w-full rounded-lg overflow-hidden shadow-lg">
        <MapContainer 
          key={mapKey}
          center={mapCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          onClick={handleMapClick}
        >
          <TileLayer url={tiles.url} attribution={tiles.attribution} />
          {markerPos && <Marker position={markerPos} />}
        </MapContainer>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Click on the map to set location, or use search/my location buttons above
      </p>
    </div>
  )
}
