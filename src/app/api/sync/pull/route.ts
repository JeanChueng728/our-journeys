import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

export async function GET() {
  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ state: null }, { status: 200 })

  const { data, error } = await supabase
    .from('journeys_state')
    .select('state')
    .eq('id', 'default')
    .maybeSingle()

  if (error) return NextResponse.json({ state: null }, { status: 200 })
  return NextResponse.json({ state: data?.state ?? null }, { status: 200 })
}
