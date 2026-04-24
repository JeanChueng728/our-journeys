'use client'

import * as React from 'react'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/cn'
import type { Media, Spot, Trip } from '@/lib/journeys/types'
import { useResolvedMediaSrc } from '@/lib/media'

export function SpotLightbox({
  open,
  onClose,
  trip,
  spot,
}: {
  open: boolean
  onClose: () => void
  trip: Trip
  spot: Spot
}) {
  const [index, setIndex] = React.useState(0)
  const media = spot.media
  const current = media[index]

  React.useEffect(() => {
    if (!open) return
    setIndex(0)
  }, [open, spot.id])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="relative w-full max-w-[1080px]">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute -top-10 right-0 h-8 w-8 rounded-full border border-white/45 bg-black/25 text-white/80 backdrop-blur hover:bg-black/35"
        >
          ×
        </button>

        <div className="overflow-hidden rounded-sm border border-white/15 bg-black/80 shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <div className="text-[10px] tracking-[0.34em] text-white/65">{trip.name}</div>
              <div className="mt-2 text-[16px] font-medium tracking-[0.02em] text-white">
                {spot.title}
              </div>
            </div>
            <div className="text-[11px] tracking-[0.18em] text-white/55">
              {index + 1}/{media.length}
            </div>
          </div>

          <div className="relative h-[620px] w-full bg-black">
            <Slide media={current} />

            {media.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => setIndex((v) => (v - 1 + media.length) % media.length)}
                  className={cn(
                    'absolute left-5 top-1/2 -translate-y-1/2 rounded-full border border-white/35',
                    'bg-white/10 px-4 py-3 text-[22px] text-white/85 backdrop-blur hover:bg-white/15',
                  )}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => setIndex((v) => (v + 1) % media.length)}
                  className={cn(
                    'absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-white/35',
                    'bg-white/10 px-4 py-3 text-[22px] text-white/85 backdrop-blur hover:bg-white/15',
                  )}
                >
                  ›
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Slide({ media }: { media: Media | undefined }) {
  const resolved = useResolvedMediaSrc(media?.src)
  if (!media) return null
  if (media.type === 'video') {
    return (
      <video
        className="h-full w-full object-contain"
        src={resolved ?? undefined}
        controls
        playsInline
      />
    )
  }
  return (
    <img
      src={resolved ?? undefined}
      alt=""
      className="h-full w-full object-contain"
    />
  )
}
