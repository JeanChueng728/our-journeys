'use client'

import { useEffect, useRef } from 'react'
import { SiteHeader } from '@/components/site-header'
import {
  getAllMedia,
  getJourneysState,
  hydrateFromStorage,
  JourneysActions,
  replaceJourneysState,
  subscribeJourneys,
} from '@/lib/journeys/store'
import { dataUrlToBlob, deleteBlob, getAdminPassword, getBlob, isDataUrl, uploadToCloud } from '@/lib/media'

const CLOUD_ENABLED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)

export function SiteShell({ children }: { children: React.ReactNode }) {
  const suppressPush = useRef(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pushingRef = useRef(false)
  const pendingRef = useRef(false)
  const lastPushedRef = useRef<string>('')

  useEffect(() => {
    hydrateFromStorage()
    if (!CLOUD_ENABLED) return

    let active = true
    void (async () => {
      try {
        const res = await fetch('/api/sync/pull', { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as { state?: unknown }
        if (!active) return
        if (json.state && typeof json.state === 'object') {
          replaceJourneysState(json.state as any)
        }
      } finally {
        suppressPush.current = false
      }
    })()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!CLOUD_ENABLED) return

    async function migrateMediaToCloud() {
      const state = getJourneysState()
      if (!state.ui.isAdmin) return

      const items = getAllMedia(state).filter(({ media }) => {
        return media.src.startsWith('idb:') || isDataUrl(media.src)
      })
      if (items.length === 0) return

      for (const item of items) {
        const kind = item.media.type === 'video' ? 'video' : 'photo'
        let blob: Blob | null = null

        if (item.media.src.startsWith('idb:')) {
          blob = await getBlob(item.media.src)
        } else if (isDataUrl(item.media.src)) {
          blob = await dataUrlToBlob(item.media.src)
        }

        if (!blob) continue

        const file = new File([blob], item.media.fileName || `${item.media.id}`, {
          type: blob.type || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
        })

        const url = await uploadToCloud({ file, kind })
        if (!url) continue

        JourneysActions.updateMediaSrc({
          tripId: item.trip.id,
          dayId: item.day.id,
          spotId: item.spot.id,
          mediaId: item.media.id,
          src: url,
        })

        if (item.media.src.startsWith('idb:')) await deleteBlob(item.media.src)
      }
    }

    async function pushNow() {
      if (pushingRef.current) {
        pendingRef.current = true
        return
      }
      pushingRef.current = true
      try {
        await migrateMediaToCloud()
        const state = getJourneysState()
        if (!state.ui.isAdmin) return
        const payload = JSON.stringify(state)
        if (payload === lastPushedRef.current) return
        const res = await fetch('/api/sync/push', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-oj-admin-password': getAdminPassword(),
          },
          body: payload,
        })
        if (res.ok) lastPushedRef.current = payload
      } finally {
        pushingRef.current = false
        if (pendingRef.current) {
          pendingRef.current = false
          await pushNow()
        }
      }
    }

    const unsub = subscribeJourneys(() => {
      if (suppressPush.current) return
      const state = getJourneysState()
      if (!state.ui.isAdmin) return

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void pushNow()
      }, 900)
    })

    return () => {
      unsub()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="min-h-dvh bg-[var(--oj-bg)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px] px-10 pb-24 pt-28">{children}</main>
    </div>
  )
}
