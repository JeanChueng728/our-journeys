'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'
import type { Spot } from '@/lib/journeys/types'
import { useResolvedMediaSrc } from '@/lib/media'
import Image from 'next/image'

function Dot({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        'h-1 w-5 rounded-full transition-colors',
        active ? 'bg-white/85' : 'bg-white/35',
      )}
    />
  )
}

export function SpotCarousel({ spot }: { spot: Spot }) {
  const slides = React.useMemo(() => {
    const sorted = [...spot.media].sort((a, b) => {
      if (a.type === b.type) return a.createdAt.localeCompare(b.createdAt)
      return a.type === 'photo' ? -1 : 1
    })
    return sorted
  }, [spot.media])

  const [index, setIndex] = React.useState(0)
  const current = slides[index]
  const resolved = useResolvedMediaSrc(current?.src)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const videoRef = React.useRef<HTMLVideoElement | null>(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    setIndex(0)
  }, [spot.id])

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15, rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  React.useEffect(() => {
    if (current?.type !== 'video') return
    const el = videoRef.current
    if (!el) return
    if (inView) {
      const p = el.play()
      if (p) void p.catch(() => {})
    } else {
      el.pause()
    }
  }, [inView, current?.id, current?.type])

  const hasMultiple = slides.length > 1

  return (
    <div className="overflow-hidden rounded-sm border border-[var(--oj-line)] bg-[var(--oj-paper)]">
      <div ref={containerRef} className="relative h-[340px] w-full bg-[#f0f0f0]">
        {current && resolved ? (
          current.type === 'video' ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              src={resolved}
              loop
              muted
              playsInline
              preload="metadata"
              style={{ filter: 'saturate(0.88) contrast(1.02)' }}
            />
          ) : (
            (() => {
              const remote = resolved.startsWith('http://') || resolved.startsWith('https://')
              return remote ? (
                <Image
                  src={resolved}
                  alt={spot.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  style={{ filter: 'saturate(0.88) contrast(1.02)' }}
                />
              ) : (
                <img
                  src={resolved}
                  alt={spot.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  style={{ filter: 'saturate(0.88) contrast(1.02)' }}
                />
              )
            })()
          )
        ) : (
          <div className="h-full w-full" />
        )}

        {hasMultiple ? (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => setIndex((v) => (v - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/45 bg-white/15 px-3 py-2 text-[18px] text-white/85 backdrop-blur"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => setIndex((v) => (v + 1) % slides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/45 bg-white/15 px-3 py-2 text-[18px] text-white/85 backdrop-blur"
            >
              ›
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                >
                  <Dot active={i === index} />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="px-6 py-6">
        <div className="text-[14px] font-medium text-[var(--oj-ink)]">{spot.title}</div>
        <div className="mt-2 text-[11px] tracking-[0.1em] text-[var(--oj-muted)]">
          {spot.dateShot}
        </div>
        <div className="mt-3 text-[12px] leading-relaxed text-[var(--oj-ink-2)]">
          {spot.description}
        </div>
      </div>
    </div>
  )
}
