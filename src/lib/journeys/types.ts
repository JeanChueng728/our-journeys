export type MediaType = 'photo' | 'video'

export type Media = {
  id: string
  type: MediaType
  src: string
  fileName: string
  createdAt: string
}

export type Location = {
  name: string
  lat: number
  lng: number
}

export type Spot = {
  id: string
  title: string
  dateShot: string
  tags: string[]
  description: string
  location: Location
  media: Media[]
}

export type Day = {
  id: string
  dayNumber: number
  title: string
  spots: Spot[]
}

export type Trip = {
  id: string
  name: string
  startDate: string
  endDate: string
  days: Day[]
}

export type JourneysState = {
  version: 1
  trips: Trip[]
  ui: {
    activeTripId: string | null
    isAdmin: boolean
    pinnedTripIds: string[]
  }
}
