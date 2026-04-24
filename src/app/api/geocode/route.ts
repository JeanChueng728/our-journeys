import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim()
  if (!q) return NextResponse.json([])

  try {
    const url =
      'https://geocoding-api.open-meteo.com/v1/search?count=5&language=zh&format=json&name=' +
      encodeURIComponent(q)

    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return NextResponse.json([])

    const json = (await res.json()) as {
      results?: Array<{
        name: string
        latitude: number
        longitude: number
        country?: string
        admin1?: string
        admin2?: string
      }>
    }

    const results = (json.results ?? []).map((r) => {
      const parts = [r.name, r.admin2, r.admin1, r.country].filter(Boolean)
      return {
        displayName: parts.join(', '),
        lat: r.latitude,
        lng: r.longitude,
      }
    })
    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
