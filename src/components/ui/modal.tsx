'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/35"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      />
      <div className="absolute inset-0 overflow-auto">
        <div className="flex min-h-full items-center justify-center p-8">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function ModalPanel({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('w-full rounded-sm bg-[var(--oj-bg)] shadow-2xl', className)}>
      {children}
    </div>
  )
}

