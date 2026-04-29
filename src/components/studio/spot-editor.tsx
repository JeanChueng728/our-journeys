'use client'

import 'maplibre-gl/dist/maplibre-gl.css'
import * as React from 'react'
import Map, { Marker, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal, ModalPanel } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/cn'
import { JourneysActions, useJourneysStore } from '@/lib/journeys/store'
import type { MediaType, Spot } from '@/lib/journeys/types'
import { Select } from '@/components/ui/select'
import { putMediaFile, useResolvedMediaSrc } from '@/lib/media'

const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

type Mode = 'add' | 'edit'

type SpotRef = {
  tripId: string
  dayId: string
  spotId: string
  spot: Spot
}

function parseTags(input: string) {
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

function parseCoord(value: string) {
  const cleaned = value.trim().replace(',', '.')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function dayIndex(value: string | undefined) {
  if (!value) return null
  const parts = value.split('-').map((x) => Number(x))
  if (parts.length !== 3) return null
  const [y, m, d] = parts
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

function tripSpanDays(startDate: string, endDate: string) {
  const a = dayIndex(startDate)
  const b = dayIndex(endDate)
  if (a === null || b === null) return null
  return Math.max(1, b - a + 1)
}

function computeDayNumberBySpan(input: { startDate: string; endDate: string; dateShot: string; allDates: string[] }) {
  const span = tripSpanDays(input.startDate, input.endDate)
  if (span !== null && span <= 45) {
    const a = dayIndex(input.startDate)
    const b = dayIndex(input.dateShot)
    if (a === null || b === null) return 1
    return Math.max(1, b - a + 1)
  }
  const uniq = Array.from(new Set(input.allDates.filter(Boolean))).sort()
  const idx = uniq.indexOf(input.dateShot)
  return idx >= 0 ? idx + 1 : uniq.length + 1
}

function iconUpload(kind: 'photo' | 'video') {
  if (kind === 'photo') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 19h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1.8c-.3 0-.6-.2-.8-.5l-.8-1.2c-.2-.2-.4-.3-.7-.3h-2.8c-.3 0-.5.1-.7.3l-.8 1.2c-.2.3-.5.5-.8.5H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"
          stroke="#222"
          strokeWidth="1.4"
        />
        <path
          d="M12 16.3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
          stroke="#222"
          strokeWidth="1.4"
        />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M8 7h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        stroke="#222"
        strokeWidth="1.4"
      />
      <path
        d="M14 12 11 10.5v3L14 12Z"
        fill="#222"
        stroke="#222"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SpotEditor({
  open,
  onClose,
  mode,
  editingSpotId,
}: {
  open: boolean
  onClose: () => void
  mode: Mode
  editingSpotId?: string | null
}) {
  const trips = useJourneysStore((s) => s.trips)
  const isAdmin = useJourneysStore((s) => s.ui.isAdmin)
  const ref = React.useMemo(() => locateSpot(trips, editingSpotId ?? null), [trips, editingSpotId])

  const [tripId, setTripId] = React.useState<string>('')
  const [dayNumber, setDayNumber] = React.useState<number>(1)
  const [dayTitle, setDayTitle] = React.useState<string>('Day 1')
  const [dayNumberTouched, setDayNumberTouched] = React.useState(false)
  const [dayTitleTouched, setDayTitleTouched] = React.useState(false)

  const [title, setTitle] = React.useState('')
  const [dateShot, setDateShot] = React.useState('')
  const [tags, setTags] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [locationName, setLocationName] = React.useState('')
  const [lat, setLat] = React.useState<string>('')
  const [lng, setLng] = React.useState<string>('')
  const [picking, setPicking] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [searching, setSearching] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<
    Array<{ displayName: string; lat: number; lng: number }>
  >([])

  const [draftMedia, setDraftMedia] = React.useState<
    Array<{ id: string; type: MediaType; src: string; fileName: string }>
  >([])
  const [draftBlobs, setDraftBlobs] = React.useState<string[]>([])

  const photoRef = React.useRef<HTMLInputElement | null>(null)
  const videoRef = React.useRef<HTMLInputElement | null>(null)
  const mapRef = React.useRef<MapRef | null>(null)

  React.useEffect(() => {
    if (!open) return

    if (mode === 'edit' && ref) {
      setTripId(ref.tripId)
      const day = trips.find((t) => t.id === ref.tripId)?.days.find((d) => d.id === ref.dayId)
      setDayNumber(day?.dayNumber ?? 1)
      setDayTitle(day?.title ?? `Day ${day?.dayNumber ?? 1}`)
      setDayNumberTouched(false)
      setDayTitleTouched(false)
      setTitle(ref.spot.title)
      setDateShot(ref.spot.dateShot)
      setTags(ref.spot.tags.join(', '))
      setDescription(ref.spot.description)
      setLocationName(ref.spot.location.name)
      setLat(String(ref.spot.location.lat))
      setLng(String(ref.spot.location.lng))
      setDraftMedia([])
      setDraftBlobs([])
      setPicking(false)
      setSearchQuery('')
      setSearchResults([])
      setSearching(false)
      return
    }

    const initialTrip = trips[0]
    setTripId(initialTrip?.id ?? '')
    setDayNumber(1)
    setDayTitle('Day 1')
    setDayNumberTouched(false)
    setDayTitleTouched(false)
    setTitle('')
    setDateShot(new Date().toISOString().slice(0, 10))
    setTags('')
    setDescription('')
    setLocationName('')
    setLat('')
    setLng('')
    setDraftMedia([])
    setDraftBlobs([])
    setPicking(false)
    setSearchQuery('')
    setSearchResults([])
    setSearching(false)
  }, [open, mode, ref, trips])

  React.useEffect(() => {
    if (!open) return
    if (mode !== 'add') return
    const trip = trips.find((t) => t.id === tripId)
    if (!trip) return
    const allDates = trip.days.flatMap((d) => d.spots.map((s) => s.dateShot)).concat(dateShot)
    const computed = computeDayNumberBySpan({
      startDate: trip.startDate,
      endDate: trip.endDate,
      dateShot,
      allDates,
    })
    if (!dayNumberTouched) setDayNumber(computed)
    if (!dayTitleTouched) {
      const existing = trip.days.find((d) => d.dayNumber === computed)
      setDayTitle(existing?.title ?? `Day ${computed}`)
    }
  }, [open, mode, tripId, dateShot, trips, dayNumberTouched, dayTitleTouched])

  const parsedLat = parseCoord(lat)
  const parsedLng = parseCoord(lng)
  const canSave =
    isAdmin && title.trim().length > 0 && !!tripId && !!dateShot && parsedLat !== null && parsedLng !== null

  async function runGeocode(query: string) {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    try {
      const res = await fetch('/api/geocode?q=' + encodeURIComponent(q))
      const json = (await res.json()) as Array<{ displayName: string; lat: number; lng: number }>
      setSearchResults(json)
    } finally {
      setSearching(false)
    }
  }

  async function onPickFiles(kind: MediaType, files: FileList | null) {
    if (!isAdmin) return
    if (!files || files.length === 0) return
    const list = Array.from(files)
    for (const file of list) {
      const src = await putMediaFile({
        file,
        kind: kind === 'video' ? 'video' : 'photo',
      })

      if (mode === 'edit' && ref) {
        JourneysActions.addMedia({
          tripId: ref.tripId,
          dayId: ref.dayId,
          spotId: ref.spotId,
          type: kind,
          src,
          fileName: file.name,
        })
        continue
      }

      const id = `draft_${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`
      setDraftMedia((prev) => [...prev, { id, type: kind, src, fileName: file.name }])
      if (kind === 'video') setDraftBlobs((prev) => [...prev, src])
    }
  }

  const media = mode === 'edit' ? ref?.spot.media ?? [] : draftMedia

  return (
    <Modal open={open} onClose={onClose}>
      <ModalPanel className="w-full max-w-[1120px] border border-[var(--oj-line)] bg-[var(--oj-bg)]">
        <div className="flex items-center justify-between border-b border-[var(--oj-line)] px-10 py-7">
          <div className="text-[12px] tracking-[0.34em] text-[var(--oj-muted)]">
            {mode === 'edit' ? 'EDIT SPOT' : 'ADD SPOT'}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-[var(--oj-line)] bg-white/55 text-[18px] text-[var(--oj-ink)] hover:bg-white"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-[1fr_1fr] gap-12 px-10 py-10">
          <div>
            {mode === 'add' ? (
              <div className="grid grid-cols-2 gap-7">
                <div className="space-y-2">
                  <Label>TRIP</Label>
                  <Select value={tripId} onChange={(e) => setTripId(e.target.value)}>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>DAY</Label>
                  <Input
                    inputMode="numeric"
                    value={String(dayNumber)}
                    onChange={(e) => {
                      setDayNumberTouched(true)
                      setDayNumber(Math.max(1, Number(e.target.value || 1)))
                    }}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>DAY TITLE</Label>
                  <Input
                    value={dayTitle}
                    onChange={(e) => {
                      setDayTitleTouched(true)
                      setDayTitle(e.target.value)
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div className={cn('mt-8 space-y-7', mode === 'add' && 'mt-10')}>
              <div className="space-y-2">
                <Label>TITLE</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-7">
                <div className="space-y-2">
                  <Label>DATE SHOT</Label>
                  <Input type="date" value={dateShot} onChange={(e) => setDateShot(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>TAGS</Label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="自然, 山景" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>DESCRIPTION</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>

              <div className="flex items-center justify-between">
                <Label>LOCATION</Label>
                <button
                  type="button"
                  onClick={() => setPicking((v) => !v)}
                  className="text-[10px] tracking-[0.34em] text-[var(--oj-muted)] hover:text-[var(--oj-ink)]"
                >
                  PICK ON MAP
                </button>
              </div>

              <div className="space-y-2">
                <Input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Location"
                />
              </div>

              <div className="grid grid-cols-2 gap-7">
                <div className="space-y-2">
                  <Label>LAT</Label>
                  <Input value={lat} onChange={(e) => setLat(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>LNG</Label>
                  <Input value={lng} onChange={(e) => setLng(e.target.value)} />
                </div>
              </div>

              {picking ? (
                <div className="overflow-hidden rounded-sm border border-[var(--oj-line)] bg-white/70">
                  <div className="border-b border-[var(--oj-line)] bg-white/60 px-4 py-3">
                    <div className="flex gap-3">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search place..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void runGeocode(searchQuery)
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        disabled={searching || !searchQuery.trim()}
                        onClick={() => {
                          void runGeocode(searchQuery)
                        }}
                      >
                        SEARCH
                      </Button>
                    </div>
                    {searchResults.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {searchResults.map((r) => (
                          <button
                            key={`${r.lat}_${r.lng}_${r.displayName}`}
                            type="button"
                            onClick={() => {
                              setLat(r.lat.toFixed(6))
                              setLng(r.lng.toFixed(6))
                              if (!locationName.trim()) setLocationName(r.displayName)
                              mapRef.current?.flyTo({
                                center: [r.lng, r.lat],
                                zoom: 12,
                                duration: 650,
                              })
                            }}
                            className="block w-full truncate rounded-sm border border-[var(--oj-line)] bg-white/70 px-3 py-2 text-left text-[12px] text-[var(--oj-ink)] hover:bg-white"
                          >
                            {r.displayName}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="h-[240px] w-full">
                    <Map
                      ref={mapRef}
                      mapStyle={LIGHT_STYLE}
                      initialViewState={{
                        latitude: parsedLat ?? 26.2,
                        longitude: parsedLng ?? 112.4,
                        zoom: parsedLat !== null && parsedLng !== null ? 9 : 4,
                      }}
                      onClick={(e: MapLayerMouseEvent) => {
                        setLat(e.lngLat.lat.toFixed(6))
                        setLng(e.lngLat.lng.toFixed(6))
                      }}
                      reuseMaps
                    >
                      {parsedLat !== null && parsedLng !== null ? (
                        <Marker latitude={parsedLat} longitude={parsedLng} anchor="center">
                          <div className="h-3 w-3 rounded-full bg-[var(--oj-khaki)] shadow-[0_0_0_3px_rgba(184,154,106,0.18)]" />
                        </Marker>
                      ) : null}
                    </Map>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <div className="text-center text-[10px] tracking-[0.34em] text-[var(--oj-muted)]">
              MEDIA
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="flex h-11 items-center justify-center gap-3 rounded-sm border border-[var(--oj-line)] bg-white/55 text-[11px] tracking-[0.32em] text-[var(--oj-ink)] hover:bg-white"
                disabled={!isAdmin}
              >
                {iconUpload('photo')} PHOTO
              </button>
              <button
                type="button"
                onClick={() => videoRef.current?.click()}
                className="flex h-11 items-center justify-center gap-3 rounded-sm border border-[var(--oj-line)] bg-white/55 text-[11px] tracking-[0.32em] text-[var(--oj-ink)] hover:bg-white"
                disabled={!isAdmin}
              >
                {iconUpload('video')} VIDEO
              </button>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void onPickFiles('photo', e.target.files)}
              />
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => void onPickFiles('video', e.target.files)}
              />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
              {media.map((m) => (
                <MediaTile
                  key={m.id}
                  type={m.type}
                  src={m.src}
                  onRemove={() => {
                    if (!isAdmin) return
                    if (mode === 'edit' && ref) {
                      JourneysActions.deleteMedia({
                        tripId: ref.tripId,
                        dayId: ref.dayId,
                        spotId: ref.spotId,
                        mediaId: m.id,
                      })
                      return
                    }
                    setDraftMedia((prev) => prev.filter((x) => x.id !== m.id))
                    if (m.type === 'video') setDraftBlobs((prev) => prev.filter((r) => r !== m.src))
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-4 border-t border-[var(--oj-line)] bg-[var(--oj-bg)]/95 px-10 py-6 backdrop-blur">
          <Button variant="outline" onClick={onClose}>
            CANCEL
          </Button>
          <Button
            variant="primary"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return

              if (mode === 'edit' && ref) {
                JourneysActions.updateSpot({
                  tripId: ref.tripId,
                  dayId: ref.dayId,
                  spotId: ref.spotId,
                  patch: {
                    title: title.trim(),
                    dateShot,
                    tags: parseTags(tags),
                    description,
                    location: {
                      name: locationName,
                      lat: parsedLat ?? 0,
                      lng: parsedLng ?? 0,
                    },
                  },
                })
                onClose()
                return
              }

              const id = JourneysActions.addSpot({
                tripId,
                dayNumber,
                title: title.trim(),
                dateShot,
                tags: parseTags(tags),
                description,
                locationName: locationName || 'Untitled Location',
                lat: parsedLat ?? 0,
                lng: parsedLng ?? 0,
              })

              const createdTrip = trips.find((t) => t.id === tripId)
              const createdDay = createdTrip?.days.find((d) => d.dayNumber === dayNumber)
              if (createdDay) {
                if (dayTitle.trim() && createdDay.title !== dayTitle.trim()) {
                  JourneysActions.updateDayTitle({
                    tripId,
                    dayId: createdDay.id,
                    title: dayTitle.trim(),
                  })
                }
                for (const m of draftMedia) {
                  JourneysActions.addMedia({
                    tripId,
                    dayId: createdDay.id,
                    spotId: id,
                    type: m.type,
                    src: m.src,
                    fileName: m.fileName,
                  })
                }
              }

              onClose()
            }}
          >
            SAVE CHANGES
          </Button>
        </div>
      </ModalPanel>
    </Modal>
  )
}

function MediaTile({
  type,
  src,
  onRemove,
}: {
  type: MediaType
  src: string
  onRemove: () => void
}) {
  const resolved = useResolvedMediaSrc(src)
  return (
    <div className="relative overflow-hidden rounded-sm border border-[var(--oj-line)] bg-white/60">
      {type === 'video' ? (
        resolved ? (
          <video
            className="h-[220px] w-full object-cover"
            src={resolved}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="h-[220px] w-full bg-[#efefef]" />
        )
      ) : resolved ? (
        <img className="h-[220px] w-full object-cover" src={resolved} alt="" />
      ) : (
        <div className="h-[220px] w-full bg-[#efefef]" />
      )}
      <button
        type="button"
        aria-label="Remove"
        onClick={onRemove}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white/90 backdrop-blur hover:bg-black/35"
      >
        ×
      </button>
    </div>
  )
}

function locateSpot(trips: Array<{ id: string; days: Array<{ id: string; spots: Spot[] }> }>, id: string | null) {
  if (!id) return null
  for (const trip of trips) {
    for (const day of trip.days) {
      for (const spot of day.spots) {
        if (spot.id === id) return { tripId: trip.id, dayId: day.id, spotId: spot.id, spot }
      }
    }
  }
  return null
}
