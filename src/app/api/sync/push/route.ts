import { NextResponse } from 'next/server'
import { expectedAdminPassword, supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function normalizeState(raw: unknown) {
  if (!isObject(raw)) return null
  if (raw.version !== 1) return null
  if (!Array.isArray(raw.trips)) return null
  if (!isObject(raw.ui)) return null
  const activeTripId = (raw.ui as any).activeTripId ?? null
  const isAdmin = Boolean((raw.ui as any).isAdmin ?? false)
  return { ...(raw as any), ui: { activeTripId, isAdmin } }
}

export async function POST(req: Request) {
  const password = req.headers.get('x-oj-admin-password') || ''
  if (password !== expectedAdminPassword()) return NextResponse.json({ ok: false }, { status: 401 })

  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false }, { status: 501 })

  const raw = await req.json().catch(() => null)
  const state = normalizeState(raw)
  if (!state) return NextResponse.json({ ok: false }, { status: 400 })

  const { error } = await supabase
    .from('journeys_state')
    .upsert({ id: 'default', state }, { onConflict: 'id' })

  if (error) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 200 })
}
