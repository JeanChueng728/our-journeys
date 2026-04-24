'use client'

import * as React from 'react'
import { cn } from '@/lib/cn'

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-[10px] tracking-[0.34em] text-[var(--oj-muted)]', className)}
      {...props}
    />
  )
}

