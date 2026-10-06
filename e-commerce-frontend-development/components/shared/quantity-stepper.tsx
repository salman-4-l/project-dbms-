'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  size = 'md',
}: {
  value: number
  max: number
  onChange: (value: number) => void
  label: string
  size?: 'sm' | 'md'
}) {
  const buttonClass = cn(
    'flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40',
    size === 'sm' ? 'size-7' : 'size-9',
  )

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex items-center rounded-full border bg-card p-0.5', size === 'sm' && 'text-sm')}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>
      <span className={cn('text-center font-medium tabular-nums', size === 'sm' ? 'w-7' : 'w-10')} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}
