'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { JourneysActions, getActiveTrip, useJourneysStore } from '@/lib/journeys/store'
import type { Trip } from '@/lib/journeys/types'
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

export function CollectionsView() {
  const trips = useJourneysStore((s) => s.trips)
  const activeTrip = useJourneysStore((s) => getActiveTrip(s))

  React.useEffect(() => {
    if (!activeTrip && trips.length > 0) JourneysActions.setActiveTrip(trips[0].id)
  }, [activeTrip, trips])

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
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {trips.map((t) => (
            <TripChip key={t.id} trip={t} active={t.id === activeTrip.id} />
          ))}
        </div>
      </div>

      <div className="mt-12 border-t border-[var(--oj-line)]" />

      <div className="mx-auto mt-10 w-full max-w-[1120px]">
        <div className="relative">
          <div className="absolute left-[22px] top-0 h-full w-px bg-[var(--oj-line)]" />

          <div className="space-y-16 pb-10">
            {activeTrip.days
              .slice()
              .sort((a, b) => a.dayNumber - b.dayNumber)
              .map((day) => (
                <section key={day.id} className="relative grid grid-cols-[110px_1fr] gap-10">
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

