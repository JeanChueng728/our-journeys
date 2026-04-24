'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'
import { getAllSpots, useJourneysStore } from '@/lib/journeys/store'
import type { Day, Spot, Trip } from '@/lib/journeys/types'
import { Select } from '@/components/ui/select'
import { SpotLightbox } from './spot-lightbox'
import { useResolvedMediaSrc } from '@/lib/media'

type FlatSpot = { trip: Trip; day: Day; spot: Spot }

function coverOf(spot: Spot) {
  const preferred = spot.media.find((m) => m.type === 'photo') ?? spot.media[0]
  return preferred ?? null
}

export function GalleryView() {
  const spots = useJourneysStore((s) => getAllSpots(s)) as FlatSpot[]
  const trips = useJourneysStore((s) => s.trips)

  const [tripId, setTripId] = React.useState<string>('all')
  const [spotId, setSpotId] = React.useState<string>('all')
  const [tag, setTag] = React.useState<string>('all')
  const [mediaType, setMediaType] = React.useState<string>('all')

  const tags = React.useMemo(() => {
    const set = new Set<string>()
    for (const x of spots) for (const t of x.spot.tags) set.add(t)
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [spots])

  const filtered = React.useMemo(() => {
    return spots.filter((x) => {
      if (tripId !== 'all' && x.trip.id !== tripId) return false
      if (spotId !== 'all' && x.spot.id !== spotId) return false
      if (tag !== 'all' && !x.spot.tags.includes(tag)) return false
      if (mediaType !== 'all' && !x.spot.media.some((m) => m.type === mediaType)) return false
      return true
    })
  }, [spots, tripId, spotId, tag, mediaType])

  const [lightbox, setLightbox] = React.useState<FlatSpot | null>(null)

  return (
    <div className="w-full">
      <div className="flex items-end justify-between">
        <div className="text-[12px] tracking-[0.34em] text-[var(--oj-muted)]">GALLERY</div>
        <div className="flex w-full max-w-[680px] gap-4">
          <div className="relative w-[210px]">
            <Select value={tripId} onChange={(e) => setTripId(e.target.value)}>
              <option value="all">All Trips</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="relative w-[210px]">
            <Select value={spotId} onChange={(e) => setSpotId(e.target.value)}>
              <option value="all">All Spots</option>
              {spots.map((x) => (
                <option key={x.spot.id} value={x.spot.id}>
                  {x.spot.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="relative w-[160px]">
            <Select value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="all">All Tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="relative w-[140px]">
            <Select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="columns-1 gap-10 md:columns-3">
          {filtered.map((x) => (
            <SpotCard key={x.spot.id} item={x} onOpen={() => setLightbox(x)} />
          ))}
        </div>
      </div>

      {lightbox ? (
        <SpotLightbox
          open={!!lightbox}
          onClose={() => setLightbox(null)}
          trip={lightbox.trip}
          spot={lightbox.spot}
        />
      ) : null}
    </div>
  )
}

function SpotCard({ item, onOpen }: { item: FlatSpot; onOpen: () => void }) {
  const cover = coverOf(item.spot)
  const isVideo = cover?.type === 'video'
  const resolved = useResolvedMediaSrc(cover?.src)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group mb-10 block w-full break-inside-avoid overflow-hidden rounded-sm border border-[var(--oj-line)] bg-white/70 text-left shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
    >
      <div className="relative w-full bg-[#efefef]">
        {cover && resolved ? (
          isVideo ? (
            <video
              className={cn(
                'h-auto w-full object-cover',
                'grayscale-[0.55] saturate-[0.35] contrast-[1.05] transition duration-300 group-hover:grayscale-0 group-hover:saturate-100',
              )}
              src={resolved}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              className={cn(
                'h-auto w-full object-cover',
                'grayscale-[0.55] saturate-[0.35] contrast-[1.05] transition duration-300 group-hover:grayscale-0 group-hover:saturate-100',
              )}
              src={resolved}
              alt={item.spot.title}
            />
          )
        ) : (
          <div className="h-[220px] w-full" />
        )}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-sm border border-white/45 bg-black/25 px-5 py-3 text-[11px] tracking-[0.32em] text-white/90 backdrop-blur">
            VIEW
          </div>
        </div>
      </div>

      <div className="px-8 py-7">
        <div className="text-center font-[var(--font-cormorant)] text-[16px] font-medium tracking-[0.06em]">
          {item.spot.title}
        </div>
        <div className="mt-2 text-center text-[10px] tracking-[0.34em] text-[var(--oj-muted)]">
          {item.trip.name}
        </div>
      </div>
    </button>
  )
}
