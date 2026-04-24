import { useRef, useSyncExternalStore } from 'react'
import { SEED_STATE } from './seed'
import type { Day, JourneysState, Media, MediaType, Spot, Trip } from './types'

const STORAGE_KEY = 'our-journeys:data:v1'

type Listener = () => void

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function normalizeState(raw: unknown): JourneysState | null {
  if (!raw || typeof raw !== 'object') return null
  const v = (raw as any).version
  if (v !== 1) return null
  if (!Array.isArray((raw as any).trips)) return null
  const uiRaw = (raw as any).ui
  const activeTripId = uiRaw?.activeTripId ?? null
  const isAdmin = Boolean(uiRaw?.isAdmin ?? false)
  return {
    ...(raw as JourneysState),
    ui: { activeTripId, isAdmin },
  }
}

let state: JourneysState = clone(SEED_STATE)
const listeners = new Set<Listener>()
let hydrated = false

function emit() {
  for (const l of listeners) l()
}

function persist(next: JourneysState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function hydrateFromStorage() {
  if (hydrated) return
  hydrated = true
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  const parsed = normalizeState(safeParse(raw))
  if (!parsed) return
  state = parsed
  emit()
}

export function getJourneysState() {
  return state
}

export function replaceJourneysState(next: JourneysState) {
  state = next
  persist(state)
  emit()
}

function setJourneysState(updater: (prev: JourneysState) => JourneysState) {
  state = updater(state)
  persist(state)
  emit()
}

export function subscribeJourneys(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useJourneysStore<T>(selector: (s: JourneysState) => T): T {
  const server = useRef<JourneysState>(SEED_STATE)
  const snapshot = useSyncExternalStore(subscribeJourneys, getJourneysState, () => server.current)
  return selector(snapshot)
}

function updateTrip(tripId: string, updater: (trip: Trip) => Trip) {
  setJourneysState((prev) => {
    const next = clone(prev)
    next.trips = next.trips.map((t) => (t.id === tripId ? updater(t) : t))
    return next
  })
}

export const JourneysActions = {
  setActiveTrip(tripId: string | null) {
    setJourneysState((prev) => ({ ...prev, ui: { ...prev.ui, activeTripId: tripId } }))
  },

  setAdmin(isAdmin: boolean) {
    setJourneysState((prev) => ({ ...prev, ui: { ...prev.ui, isAdmin } }))
  },

  replaceState(next: JourneysState) {
    replaceJourneysState(next)
  },

  createTrip(input: { name: string; startDate: string; endDate: string }) {
    const tripId = uid('trip')
    const trip: Trip = {
      id: tripId,
      name: input.name.trim(),
      startDate: input.startDate,
      endDate: input.endDate,
      days: [],
    }
    setJourneysState((prev) => {
      const next = clone(prev)
      next.trips = [trip, ...next.trips]
      next.ui.activeTripId = tripId
      return next
    })
    return tripId
  },

  ensureDay(tripId: string, dayNumber: number) {
    const dayId = uid('day')
    let createdId: string | null = null
    updateTrip(tripId, (trip) => {
      const existing = trip.days.find((d) => d.dayNumber === dayNumber)
      if (existing) {
        createdId = existing.id
        return trip
      }
      const day: Day = { id: dayId, dayNumber, title: `Day ${dayNumber}`, spots: [] }
      createdId = dayId
      return { ...trip, days: [...trip.days, day].sort((a, b) => a.dayNumber - b.dayNumber) }
    })
    return createdId ?? dayId
  },

  updateDayTitle(input: { tripId: string; dayId: string; title: string }) {
    updateTrip(input.tripId, (trip) => {
      const days = trip.days.map((d) => (d.id === input.dayId ? { ...d, title: input.title } : d))
      return { ...trip, days }
    })
  },

  addSpot(input: {
    tripId: string
    dayNumber: number
    title: string
    dateShot: string
    tags: string[]
    description: string
    locationName: string
    lat: number
    lng: number
  }) {
    const spotId = uid('spot')
    const dayId = JourneysActions.ensureDay(input.tripId, input.dayNumber)
    const spot: Spot = {
      id: spotId,
      title: input.title.trim(),
      dateShot: input.dateShot,
      tags: input.tags,
      description: input.description,
      location: { name: input.locationName, lat: input.lat, lng: input.lng },
      media: [],
    }
    updateTrip(input.tripId, (trip) => {
      const days = trip.days.map((d) =>
        d.id === dayId ? { ...d, spots: [...d.spots, spot] } : d,
      )
      return { ...trip, days }
    })
    return spotId
  },

  updateSpot(input: {
    tripId: string
    dayId: string
    spotId: string
    patch: Partial<Omit<Spot, 'id' | 'media' | 'location'>> & {
      location?: Partial<Spot['location']>
    }
  }) {
    updateTrip(input.tripId, (trip) => {
      const days = trip.days.map((d) => {
        if (d.id !== input.dayId) return d
        return {
          ...d,
          spots: d.spots.map((s) => {
            if (s.id !== input.spotId) return s
            const next: Spot = {
              ...s,
              ...input.patch,
              location: { ...s.location, ...(input.patch.location ?? {}) },
            }
            return next
          }),
        }
      })
      return { ...trip, days }
    })
  },

  deleteSpot(input: { tripId: string; dayId: string; spotId: string }) {
    updateTrip(input.tripId, (trip) => {
      const days = trip.days.map((d) => {
        if (d.id !== input.dayId) return d
        return { ...d, spots: d.spots.filter((s) => s.id !== input.spotId) }
      })
      return { ...trip, days: days.filter((d) => d.spots.length > 0 || trip.days.length === 1) }
    })
  },

  addMedia(input: {
    tripId: string
    dayId: string
    spotId: string
    type: MediaType
    src: string
    fileName: string
  }) {
    const media: Media = {
      id: uid('media'),
      type: input.type,
      src: input.src,
      fileName: input.fileName,
      createdAt: nowIso(),
    }
    updateTrip(input.tripId, (trip) => {
      const days = trip.days.map((d) => {
        if (d.id !== input.dayId) return d
        return {
          ...d,
          spots: d.spots.map((s) =>
            s.id === input.spotId ? { ...s, media: [...s.media, media] } : s,
          ),
        }
      })
      return { ...trip, days }
    })
    return media.id
  },

  updateMediaSrc(input: { tripId: string; dayId: string; spotId: string; mediaId: string; src: string }) {
    updateTrip(input.tripId, (trip) => {
      const days = trip.days.map((d) => {
        if (d.id !== input.dayId) return d
        return {
          ...d,
          spots: d.spots.map((s) => {
            if (s.id !== input.spotId) return s
            return {
              ...s,
              media: s.media.map((m) => (m.id === input.mediaId ? { ...m, src: input.src } : m)),
            }
          }),
        }
      })
      return { ...trip, days }
    })
  },

  deleteMedia(input: { tripId: string; dayId: string; spotId: string; mediaId: string }) {
    updateTrip(input.tripId, (trip) => {
      const days = trip.days.map((d) => {
        if (d.id !== input.dayId) return d
        return {
          ...d,
          spots: d.spots.map((s) =>
            s.id === input.spotId
              ? { ...s, media: s.media.filter((m) => m.id !== input.mediaId) }
              : s,
          ),
        }
      })
      return { ...trip, days }
    })
  },
} as const

export function getActiveTrip(stateIn: JourneysState) {
  const tripId = stateIn.ui.activeTripId
  if (!tripId) return stateIn.trips[0] ?? null
  return stateIn.trips.find((t) => t.id === tripId) ?? stateIn.trips[0] ?? null
}

export function getAllSpots(stateIn: JourneysState) {
  const result: Array<{ trip: Trip; day: Day; spot: Spot }> = []
  for (const trip of stateIn.trips) {
    for (const day of trip.days) {
      for (const spot of day.spots) {
        result.push({ trip, day, spot })
      }
    }
  }
  return result
}

export function getAllMedia(stateIn: JourneysState) {
  const result: Array<{ trip: Trip; day: Day; spot: Spot; media: Media }> = []
  for (const trip of stateIn.trips) {
    for (const day of trip.days) {
      for (const spot of day.spots) {
        for (const media of spot.media) {
          result.push({ trip, day, spot, media })
        }
      }
    }
  }
  return result
}
