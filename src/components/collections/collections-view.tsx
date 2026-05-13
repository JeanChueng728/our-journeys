'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { JourneysActions, getActiveTrip, useJourneysStore } from '@/lib/journeys/store'
import type { Spot, Trip } from '@/lib/journeys/types'
import { useResolvedMediaSrc } from '@/lib/media'
import { SpotCarousel } from './spot-carousel'

function dayIndex(value: string | undefined) {
  if (!value) return null
  const parts = value.split('-').map((x) => Number(x))
  if (parts.length !== 3) return null
  const [y, m, d] = parts
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000)
}

function uidTimestamp(id: string) {
  const parts = id.split('_')
  const hex = parts[parts.length - 1]
  if (!hex) return 0
  const n = Number.parseInt(hex, 16)
  return Number.isFinite(n) ? n : 0
}

function latestSpotCreatedAt(trip: Trip) {
  let max = 0
  for (const day of trip.days) {
    for (const spot of day.spots) {
      max = Math.max(max, uidTimestamp(spot.id))
    }
  }
  return max
}

function tripSpanDays(trip: Trip) {
  const a = dayIndex(trip.startDate)
  const b = dayIndex(trip.endDate)
  if (a === null || b === null) return null
  return Math.max(1, b - a + 1)
}

function computeDayNumberBySpan(trip: Trip, dateShot: string, allDates: string[]) {
  const span = tripSpanDays(trip)

  if (span !== null && span <= 45) {
    const a = dayIndex(trip.startDate)
    const b = dayIndex(dateShot)
    if (a === null || b === null) return 1
    return Math.max(1, b - a + 1)
  }

  const uniq = Array.from(new Set(allDates.filter(Boolean))).sort()
  const idx = uniq.indexOf(dateShot)
  return idx >= 0 ? idx + 1 : uniq.length + 1
}

function firstCoverSrc(trip: Trip) {
  for (const d of trip.days) {
    for (const s of d.spots) {
      const m = s.media[0]
      if (m?.src) return m.src
    }
  }
  return null
}

function totalSpots(trip: Trip) {
  return trip.days.reduce((sum, d) => sum + d.spots.length, 0)
}

function TripCover({ src, alt }: { src: string; alt: string }) {
  const resolved = useResolvedMediaSrc(src)
  if (!resolved) return null
  const remote = resolved.startsWith('http://') || resolved.startsWith('https://')
  return remote ? (
    <Image
      src={resolved}
      alt={alt}
      width={1600}
      height={1000}
      className="h-full w-full object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
    />
  ) : (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover"
    />
  )
}

export function CollectionsView() {
  const trips = useJourneysStore((s) => s.trips)
  const activeTrip = useJourneysStore((s) => getActiveTrip(s))
  const pinnedTripIds = useJourneysStore((s) => s.ui.pinnedTripIds)

  const visibleTrips = React.useMemo(() => {
    const pinnedSet = new Set(pinnedTripIds)
    const pinned: Trip[] = pinnedTripIds
      .map((id) => trips.find((t) => t.id === id))
      .filter((t): t is Trip => Boolean(t))

    const rest = trips
      .filter((t) => !pinnedSet.has(t.id))
      .slice()
      .sort((a, b) => {
        const aLast = latestSpotCreatedAt(a)
        const bLast = latestSpotCreatedAt(b)
        if (aLast !== bLast) return bLast - aLast

        const aIdx = dayIndex(a.startDate) ?? 0
        const bIdx = dayIndex(b.startDate) ?? 0
        if (aIdx !== bIdx) return bIdx - aIdx

        return a.name.localeCompare(b.name)
      })

    return [...pinned, ...rest]
  }, [trips, pinnedTripIds])

  React.useEffect(() => {
    if (!activeTrip && visibleTrips.length > 0) {
      JourneysActions.setActiveTrip(visibleTrips[0].id)
      return
    }
    if (activeTrip && visibleTrips.length > 0 && !visibleTrips.some((t) => t.id === activeTrip.id)) {
      JourneysActions.setActiveTrip(visibleTrips[0].id)
    }
  }, [activeTrip, visibleTrips])

  const groupedDays = React.useMemo(() => {
    if (!activeTrip) return []

    const titleByNumber = new Map<number, string>()
    for (const d of activeTrip.days) titleByNumber.set(d.dayNumber, d.title)

    const allDates = activeTrip.days.flatMap((d) => d.spots.map((s) => s.dateShot))

    const grouped = new Map<number, Spot[]>()
    for (const day of activeTrip.days) {
      for (const spot of day.spots) {
        const n = computeDayNumberBySpan(activeTrip, spot.dateShot, allDates)
        const list = grouped.get(n) ?? []
        list.push(spot)
        grouped.set(n, list)
      }
    }

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dayNumber, spots]) => ({
        dayNumber,
        title: titleByNumber.get(dayNumber) ?? `Day ${dayNumber}`,
        spots: spots.slice().sort((a, b) => a.dateShot.localeCompare(b.dateShot)),
      }))
  }, [activeTrip])

  if (!activeTrip) {
    return (
      <div className="mx-auto max-w-[1120px] border border-[var(--oj-line)] bg-white/60 p-10">
        <div className="text-sm text-[var(--oj-muted)]">还没有旅行记录。</div>
        <div className="mt-6">
          <Button
            variant="primary"
            onClick={() =>
              (() => {
                const today = new Date().toISOString().slice(0, 10)
                JourneysActions.createTrip({
                  name: 'NEW TRIP',
                  startDate: today,
                  endDate: today,
                })
              })()
            }
          >
            新建旅行
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="text-xs tracking-[0.22em] text-[var(--oj-muted)]">COLLECTIONS</div>
          <div className="mt-2 font-[var(--font-cormorant)] text-[32px] font-medium text-[var(--oj-ink)]">
            旅行杂志
          </div>
        </div>
        <div className="text-sm text-[var(--oj-muted)]">{visibleTrips.length} 次旅行</div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTrips.map((t) => {
          const cover = firstCoverSrc(t)
          const active = t.id === activeTrip.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => JourneysActions.setActiveTrip(t.id)}
              className={[
                'overflow-hidden rounded-2xl border bg-white/60 text-left transition hover:bg-white',
                active ? 'border-[#111]' : 'border-[var(--oj-line)]',
              ].join(' ')}
            >
              <div className="aspect-[16/10] bg-[var(--oj-bg)]">
                {cover ? <TripCover src={cover} alt={t.name} /> : null}
              </div>
              <div className="p-4">
                <div className="text-sm text-[var(--oj-muted)]">
                  {t.startDate} — {t.endDate}
                </div>
                <div className="mt-2 text-[16px] font-medium text-[var(--oj-ink)]">{t.name}</div>
                <div className="mt-3 text-xs text-[var(--oj-muted)]">{totalSpots(t)} 个地点</div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-10 border-t border-[var(--oj-line)]" />

      <div className="mt-8 space-y-10 pb-10">
        {groupedDays.map((day) => (
          <section key={`day_${day.dayNumber}`}>
            <div className="flex items-baseline justify-between gap-6">
              <div className="font-[var(--font-cormorant)] text-[20px] font-medium text-[var(--oj-ink-2)]">
                {day.title}
              </div>
              <div className="text-xs tracking-[0.22em] text-[var(--oj-muted)]">DAY {day.dayNumber}</div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-2">
              {day.spots.map((spot) => (
                <SpotCarousel key={spot.id} spot={spot} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
