import { NextResponse } from 'next/server'
import { expectedAdminPassword, supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const BUCKET = 'our-journeys-media'

function safeName(name: string) {
  const clean = name.replaceAll('/', '_').replaceAll('\\', '_').trim()
  return clean.length > 0 ? clean : 'file'
}

export async function POST(req: Request) {
  const password = req.headers.get('x-oj-admin-password') || ''
  if (password !== expectedAdminPassword()) return NextResponse.json({ ok: false }, { status: 401 })

  const supabase = supabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false }, { status: 501 })

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ ok: false }, { status: 400 })

  const file = form.get('file')
  const kindRaw = form.get('kind')
  const kind = kindRaw === 'video' ? 'video' : 'photo'

  if (!(file instanceof File)) return NextResponse.json({ ok: false }, { status: 400 })

  const ext =
    file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase() : ''
  const base = safeName(file.name.replace(new RegExp(`\\.${ext}$`), ''))
  const path = `${kind}/${Date.now()}_${crypto.randomUUID()}_${base}${ext ? `.${ext}` : ''}`

  const buf = Buffer.from(await file.arrayBuffer())
  const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType: file.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
    upsert: false,
    cacheControl: '3600',
  })
  if (error) return NextResponse.json({ ok: false }, { status: 500 })

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ ok: true, url: data.publicUrl, path }, { status: 200 })
}
