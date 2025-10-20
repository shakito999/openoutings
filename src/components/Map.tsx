"use client"
import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { LatLngExpression } from 'leaflet'

const MapContainer: any = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false }) as any
const TileLayer: any = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false }) as any
const Marker: any = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false }) as any

export default function Map({ center = [51.505, -0.09] as LatLngExpression, onPick }: { center?: LatLngExpression; onPick?: (lat: number, lng: number) => void }) {
  const tiles = useMemo(() => ({
    url: process.env.NEXT_PUBLIC_MAP_TILES_URL!,
    attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION!,
  }), [])

  return (
    <div className="h-80 w-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}
        onClick={(e: any) => onPick?.(e.latlng.lat, e.latlng.lng)}>
        <TileLayer url={tiles.url} attribution={tiles.attribution} />
        <Marker position={center} />
      </MapContainer>
    </div>
  )
}
