'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-11 w-full appearance-none rounded-sm border border-[var(--oj-line)] bg-white/70 px-4 pr-10 text-[13px] text-[var(--oj-ink)]',
        'focus:border-[rgba(184,154,106,0.65)]',
        className,
      )}
      {...props}
    />
  )
})

