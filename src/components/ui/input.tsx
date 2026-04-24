'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-sm border border-[var(--oj-line)] bg-white/70 px-4 text-[13px] text-[var(--oj-ink)]',
        'placeholder:text-[var(--oj-muted)] focus:border-[rgba(184,154,106,0.65)]',
        className,
      )}
      {...props}
    />
  )
})

