'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import * as React from 'react'
import Map, { type MarkerEvent, Marker, NavigationControl, Popup } from 'react-map-gl/maplibre'
import { getAllSpots, useJourneysStore } from '@/lib/journeys/store'
import type { Day, Spot, Trip } from '@/lib/journeys/types'

const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

type FlatSpot = { trip: Trip; day: Day; spot: Spot }

function markerNode() {
  return (
    <div className="relative">
      <div className="h-3 w-3 rounded-full bg-[var(--oj-khaki)] shadow-[0_0_0_3px_rgba(184,154,106,0.18)]" />
    </div>
  )
}

export function TraceMap() {
  const spots = useJourneysStore((s) => getAllSpots(s)) as FlatSpot[]
  const [selected, setSelected] = React.useState<FlatSpot | null>(null)

  const sorted = React.useMemo(
    () => [...spots].sort((a, b) => a.spot.dateShot.localeCompare(b.spot.dateShot)),
    [spots],
  )

  const initial = React.useMemo(() => {
    if (sorted.length === 0) return { latitude: 26.2, longitude: 112.4, zoom: 4.1 }
    const avg = sorted.reduce(
      (acc, x) => {
        acc.lat += x.spot.location.lat
        acc.lng += x.spot.location.lng
        return acc
      },
      { lat: 0, lng: 0 },
    )
    return {
      latitude: avg.lat / sorted.length,
      longitude: avg.lng / sorted.length,
      zoom: 5.2,
    }
  }, [sorted])

  return (
    <div className="w-full">
      <div className="mb-10 px-2 text-center text-[12px] tracking-[0.34em] text-[var(--oj-muted)]">
        TRACE
      </div>

      <div className="mx-auto w-full max-w-[1120px] overflow-hidden rounded-sm border border-[var(--oj-line)] bg-white/70">
        <div className="h-[560px] w-full">
          <Map
            mapStyle={LIGHT_STYLE}
            initialViewState={initial}
            reuseMaps
          >
            <div className="absolute left-4 top-4">
              <NavigationControl showCompass={false} />
            </div>

            {sorted.map((x) => (
              <Marker
                key={x.spot.id}
                latitude={x.spot.location.lat}
                longitude={x.spot.location.lng}
                anchor="center"
                onClick={(e: MarkerEvent<MouseEvent>) => {
                  e.originalEvent.stopPropagation()
                  setSelected(x)
                }}
              >
                {markerNode()}
              </Marker>
            ))}

            {selected ? (
              <Popup
                latitude={selected.spot.location.lat}
                longitude={selected.spot.location.lng}
                closeButton={false}
                onClose={() => setSelected(null)}
                offset={10}
                anchor="top"
                className="oj-popup"
              >
                <div className="min-w-[220px] rounded-sm bg-white px-4 py-3 text-[12px]">
                  <div className="text-[11px] tracking-[0.22em] text-[var(--oj-muted)]">
                    {selected.trip.name}
                  </div>
                  <div className="mt-2 text-[14px] font-medium text-[var(--oj-ink)]">
                    {selected.spot.title}
                  </div>
                  <div className="mt-1 text-[11px] text-[var(--oj-muted)]">
                    {selected.spot.dateShot} · {selected.spot.location.name}
                  </div>
                </div>
              </Popup>
            ) : null}
          </Map>
        </div>
      </div>
    </div>
  )
}
