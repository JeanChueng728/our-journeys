'use client'

import * as React from 'react'
import { Modal, ModalPanel } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { JourneysActions, useJourneysStore } from '@/lib/journeys/store'
import type { Trip } from '@/lib/journeys/types'

export function NewTripModal({
  open,
  onClose,
  mode = 'create',
  trip,
}: {
  open: boolean
  onClose: () => void
  mode?: 'create' | 'edit'
  trip?: Trip | null
}) {
  const isAdmin = useJourneysStore((s) => s.ui.isAdmin)
  const [name, setName] = React.useState('')
  const [startDate, setStartDate] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = React.useState(() => new Date().toISOString().slice(0, 10))

  React.useEffect(() => {
    if (!open) return
    if (mode === 'edit' && trip) {
      setName(trip.name)
      setStartDate(trip.startDate)
      setEndDate(trip.endDate)
      return
    }
    setName('')
    const today = new Date().toISOString().slice(0, 10)
    setStartDate(today)
    setEndDate(today)
  }, [open, mode, trip])

  return (
    <Modal open={open} onClose={onClose}>
      <ModalPanel className="max-w-[640px] border border-[var(--oj-line)] bg-[var(--oj-bg)]">
        <div className="px-12 py-10">
          <div className="text-center text-[12px] tracking-[0.34em] text-[var(--oj-muted)]">
            {mode === 'edit' ? 'EDIT TRIP' : 'CREATE NEW TRIP'}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-7">
            <div className="space-y-2">
              <Label htmlFor="tripName">TRIP NAME</Label>
              <Input
                id="tripName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Trip Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-7">
              <div className="space-y-2">
                <Label htmlFor="startDate">START DATE</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">END DATE</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-[var(--oj-line)] bg-white/50 px-10 py-6">
          <Button variant="outline" onClick={onClose}>
            CANCEL
          </Button>
          <Button
            variant="primary"
            disabled={!isAdmin}
            onClick={() => {
              if (!isAdmin) return
              if (!name.trim()) return
              if (mode === 'edit' && trip) {
                JourneysActions.updateTripInfo({ tripId: trip.id, name, startDate, endDate })
              } else {
                JourneysActions.createTrip({ name, startDate, endDate })
              }
              onClose()
            }}
          >
            {mode === 'edit' ? 'SAVE' : 'CREATE'}
          </Button>
        </div>
      </ModalPanel>
    </Modal>
  )
}
