'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'outline' | 'subtle'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'outline', size = 'md', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border px-4 text-[11px] tracking-[0.32em] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,154,106,0.45)]',
        size === 'sm' ? 'h-9' : 'h-10',
        variant === 'primary' &&
          'border-[#111] bg-[#111] text-white hover:bg-[#0a0a0a] hover:border-[#0a0a0a]',
        variant === 'outline' &&
          'border-[var(--oj-line)] bg-[rgba(255,255,255,0.55)] text-[var(--oj-ink)] hover:bg-white',
        variant === 'subtle' &&
          'border-transparent bg-transparent text-[var(--oj-muted)] hover:text-[var(--oj-ink)]',
        className,
      )}
      {...props}
    />
  )
})

