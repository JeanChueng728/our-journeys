'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { JourneysActions, useJourneysStore } from '@/lib/journeys/store'
import type { Trip } from '@/lib/journeys/types'
import { NewTripModal } from './new-trip-modal'
import { SpotEditor } from './spot-editor'

function locateSpot(
  trips: Trip[],
  spotId: string,
): { tripId: string; dayId: string; spotId: string } | null {
  for (const trip of trips) {
    for (const day of trip.days) {
      for (const spot of day.spots) {
        if (spot.id === spotId) return { tripId: trip.id, dayId: day.id, spotId: spot.id }
      }
    }
  }
  return null
}

export function StudioDashboard() {
  const trips = useJourneysStore((s) => s.trips)
  const isAdmin = useJourneysStore((s) => s.ui.isAdmin)
  const [newTripOpen, setNewTripOpen] = React.useState(false)
  const [editTripOpen, setEditTripOpen] = React.useState(false)
  const [editingTripId, setEditingTripId] = React.useState<string | null>(null)
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editorMode, setEditorMode] = React.useState<'add' | 'edit'>('add')
  const [editingSpotId, setEditingSpotId] = React.useState<string | null>(null)

  return (
    <div className="w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-[var(--font-cormorant)] text-[26px] font-medium tracking-[0.02em]">
            Studio Dashboard
          </div>
          <div className="mt-2 text-[12px] tracking-[0.1em] text-[var(--oj-muted)]">
            在此管理您的所有旅程数据。
          </div>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setNewTripOpen(true)}>
              NEW TRIP
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setEditorMode('add')
                setEditingSpotId(null)
                setEditorOpen(true)
              }}
            >
              ADD SPOT
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-12">
        {trips.length === 0 ? (
          <div className="mx-auto max-w-[920px] rounded-sm border border-[var(--oj-line)] bg-white/60 px-10 py-14">
            <div className="text-[12px] tracking-[0.32em] text-[var(--oj-muted)]">
              No trips yet.
            </div>
            {isAdmin ? (
              <div className="mt-8">
                <Button variant="primary" onClick={() => setNewTripOpen(true)}>
                  NEW TRIP
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-10">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                canEdit={isAdmin}
                onEditTrip={() => {
                  if (!isAdmin) return
                  setEditingTripId(trip.id)
                  setEditTripOpen(true)
                }}
                onDeleteTrip={() => {
                  if (!isAdmin) return
                  const ok = window.confirm('Delete this trip and all its spots?')
                  if (!ok) return
                  JourneysActions.deleteTrip(trip.id)
                }}
                onEditSpot={(spotId) => {
                  if (!isAdmin) return
                  setEditorMode('edit')
                  setEditingSpotId(spotId)
                  setEditorOpen(true)
                }}
                onDeleteSpot={(spotId) => {
                  if (!isAdmin) return
                  const ref = locateSpot(trips, spotId)
                  if (!ref) return
                  JourneysActions.deleteSpot(ref)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <NewTripModal open={newTripOpen} onClose={() => setNewTripOpen(false)} />
      <NewTripModal
        open={editTripOpen}
        mode="edit"
        trip={editingTripId ? trips.find((t) => t.id === editingTripId) ?? null : null}
        onClose={() => {
          setEditTripOpen(false)
          setEditingTripId(null)
        }}
      />
      <SpotEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        mode={editorMode}
        editingSpotId={editingSpotId}
      />
    </div>
  )
}

function TripCard({
  trip,
  canEdit,
  onEditTrip,
  onDeleteTrip,
  onEditSpot,
  onDeleteSpot,
}: {
  trip: Trip
  canEdit: boolean
  onEditTrip: () => void
  onDeleteTrip: () => void
  onEditSpot: (spotId: string) => void
  onDeleteSpot: (spotId: string) => void
}) {
  const days = trip.days.slice().sort((a, b) => a.dayNumber - b.dayNumber)
  const pinnedTripIds = useJourneysStore((s) => s.ui.pinnedTripIds)
  const pinIndex = pinnedTripIds.indexOf(trip.id)

  return (
    <div className="mx-auto w-full max-w-[920px] rounded-sm border border-[var(--oj-line)] bg-white/60 px-10 py-10 shadow-[0_16px_40px_rgba(0,0,0,0.04)]">
      <div className="text-center">
        <div className="font-[var(--font-cormorant)] text-[22px] font-semibold tracking-[0.04em]">
          {trip.name}
        </div>
        {canEdit ? (
          <div className="mt-4 flex items-center justify-center gap-4 text-[12px]">
            <button
              type="button"
              onClick={() => JourneysActions.togglePinnedTrip(trip.id)}
              className="text-[12px] text-[var(--oj-muted)] hover:text-[var(--oj-ink)]"
            >
              {pinIndex >= 0 ? `Unpin #${pinIndex + 1}` : 'Pin'}
            </button>
            {pinIndex >= 0 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => JourneysActions.movePinnedTrip({ tripId: trip.id, direction: -1 })}
                  disabled={pinIndex === 0}
                  className="text-[12px] text-[var(--oj-muted)] hover:text-[var(--oj-ink)] disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => JourneysActions.movePinnedTrip({ tripId: trip.id, direction: 1 })}
                  disabled={pinIndex === pinnedTripIds.length - 1}
                  className="text-[12px] text-[var(--oj-muted)] hover:text-[var(--oj-ink)] disabled:opacity-40"
                >
                  ↓
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onEditTrip}
              className="text-[12px] text-[var(--oj-muted)] hover:text-[var(--oj-ink)]"
            >
              Edit Trip
            </button>
            <button
              type="button"
              onClick={onDeleteTrip}
              className="text-[12px] text-red-500/90 hover:text-red-600"
            >
              Delete Trip
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-8 space-y-10">
        {days.map((day) => {
          const spots = day.spots
          return (
            <div key={day.id} className="grid grid-cols-[160px_1fr_180px] items-start gap-10">
              <div className="relative pl-6">
                <div className="absolute left-0 top-1 h-full w-px bg-[var(--oj-line)]" />
                <div className="space-y-3 text-[12px] text-[var(--oj-ink)]">
                  {spots.map((s) => (
                    <div key={s.id} className="truncate">
                      {s.title}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <div className="text-[13px] tracking-[0.04em] text-[var(--oj-ink-2)]">
                  {day.title}
                </div>
              </div>

              <div className="space-y-3 text-right text-[12px]">
                {spots.map((s) => (
                  <div key={s.id} className="flex items-center justify-end gap-4">
                    {canEdit ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditSpot(s.id)}
                          className="text-[12px] text-[var(--oj-muted)] hover:text-[var(--oj-ink)]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSpot(s.id)}
                          className="text-[12px] text-red-500/90 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
