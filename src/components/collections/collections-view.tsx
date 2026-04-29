'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JourneysActions, getActiveTrip, useJourneysStore } from '@/lib/journeys/store'
import type { Spot, Trip } from '@/lib/journeys/types'
import { SpotCarousel } from './spot-carousel'

function TripChip({ trip, active }: { trip: Trip; active: boolean }) {
  return (
    <button
      type="button"
      onClick={() => JourneysActions.setActiveTrip(trip.id)}
      className={
        active
          ? 'h-10 rounded-sm border border-[#111] bg-[#111] px-6 text-[11px] tracking-[0.32em] text-white'
          : 'h-10 rounded-sm border border-[var(--oj-line)] bg-white/55 px-6 text-[11px] tracking-[0.32em] text-[var(--oj-ink)] hover:bg-white'
      }
    >
      {trip.name}
    </button>
  )
}

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

export function CollectionsView() {
  const trips = useJourneysStore((s) => s.trips)
  const activeTrip = useJourneysStore((s) => getActiveTrip(s))
  const [query, setQuery] = React.useState('')

  const visibleTrips = React.useMemo(() => {
    const sorted = trips
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

    const q = query.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((t) => t.name.toLowerCase().includes(q))
  }, [trips, query])

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
        <div className="text-[12px] tracking-[0.32em] text-[var(--oj-muted)]">
          No trips yet.
        </div>
        <div className="mt-6">
          <Button
            variant="primary"
            onClick={() =>
              JourneysActions.createTrip({
                name: 'NEW TRIP',
                startDate: new Date().toISOString().slice(0, 10),
                endDate: new Date().toISOString().slice(0, 10),
              })
            }
          >
            NEW TRIP
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-6">
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex w-max items-center gap-3 pr-2">
            {visibleTrips.map((t) => (
              <TripChip key={t.id} trip={t} active={t.id === activeTrip.id} />
            ))}
          </div>
        </div>

        <div className="w-[240px] shrink-0">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索行程..."
            className="h-10 bg-white/55 text-[12px]"
          />
        </div>
      </div>

      <div className="mt-12 border-t border-[var(--oj-line)]" />

      <div className="mx-auto mt-10 w-full max-w-[1120px]">
        <div className="relative">
          <div className="absolute left-[22px] top-0 h-full w-px bg-[var(--oj-line)]" />

          <div className="space-y-16 pb-10">
            {groupedDays.map((day) => (
              <section key={`day_${day.dayNumber}`} className="relative grid grid-cols-[110px_1fr] gap-10">
                <div className="relative">
                  <div className="absolute left-[6px] top-3 h-12 w-12 rounded-full border border-[var(--oj-khaki)] bg-[var(--oj-bg)]">
                    <div className="flex h-full w-full items-center justify-center text-[10px] tracking-[0.22em] text-[var(--oj-muted)]">
                      D{day.dayNumber}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-8 text-center font-[var(--font-cormorant)] text-[20px] font-medium tracking-[0.06em] text-[var(--oj-ink-2)]">
                    {day.title}
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                    {day.spots.map((spot) => (
                      <SpotCarousel key={spot.id} spot={spot} />
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
