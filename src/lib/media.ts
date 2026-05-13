import { useEffect, useMemo, useState } from 'react'

const DB_NAME = 'our-journeys-media'
const DB_VERSION = 1
const STORE = 'blobs'

const CLOUD_ENABLED = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)
const ADMIN_PASS_KEY = 'our-journeys:admin-pass'

export function getAdminPassword() {
  if (typeof window === 'undefined') return 'J54818'
  return window.localStorage.getItem(ADMIN_PASS_KEY) || 'J54818'
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
    tx.oncomplete = () => db.close()
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function putBlob(blob: Blob) {
  const id = uid('blob')
  await withStore('readwrite', (s) => s.put(blob, id))
  return `idb:${id}`
}

export async function uploadToCloud(input: { file: File; kind: 'photo' | 'video' }) {
  if (!CLOUD_ENABLED) return null
  try {
    const form = new FormData()
    form.set('file', input.file)
    form.set('kind', input.kind)
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: form,
      headers: { 'x-oj-admin-password': getAdminPassword() },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { url?: string }
    return typeof json.url === 'string' && json.url.length > 0 ? json.url : null
  } catch {
    return null
  }
}

export async function putMediaFile(input: { file: File; kind: 'photo' | 'video' }) {
  const cloudUrl = await uploadToCloud(input)
  if (cloudUrl) return cloudUrl
  return await putBlob(input.file)
}

export async function getBlob(ref: string) {
  if (!ref.startsWith('idb:')) return null
  const id = ref.slice('idb:'.length)
  const blob = await withStore<Blob | undefined>('readonly', (s) => s.get(id))
  return blob ?? null
}

export async function deleteBlob(ref: string) {
  if (!ref.startsWith('idb:')) return
  const id = ref.slice('idb:'.length)
  await withStore('readwrite', (s) => s.delete(id))
}

export function isDataUrl(src: string) {
  return src.startsWith('data:')
}

export async function dataUrlToBlob(src: string) {
  const res = await fetch(src)
  return await res.blob()
}

export async function readAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function useResolvedMediaSrc(src: string | undefined | null) {
  const stable = useMemo(() => src ?? null, [src])
  const [resolved, setResolved] = useState<string | null>(stable && !stable.startsWith('idb:') ? stable : null)

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    async function run() {
      if (!stable) {
        setResolved(null)
        return
      }
      if (!stable.startsWith('idb:')) {
        setResolved(stable)
        return
      }
      const blob = await getBlob(stable)
      if (!active) return
      if (!blob) {
        setResolved(null)
        return
      }
      objectUrl = URL.createObjectURL(blob)
      setResolved(objectUrl)
    }

    void run()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [stable])

  return resolved
}
