'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[92px] w-full resize-none rounded-sm border border-[var(--oj-line)] bg-white/70 px-4 py-3 text-[13px] text-[var(--oj-ink)]',
        'placeholder:text-[var(--oj-muted)] focus:border-[rgba(184,154,106,0.65)]',
        className,
      )}
      {...props}
    />
  )
})

