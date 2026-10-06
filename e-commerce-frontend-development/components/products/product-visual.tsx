import { getInitials } from '@/lib/format'
import { cn } from '@/lib/utils'

const tones = [
  'bg-[oklch(0.94_0.015_85)] text-[oklch(0.4_0.03_70)]',
  'bg-[oklch(0.93_0.02_160)] text-[oklch(0.38_0.06_160)]',
  'bg-[oklch(0.93_0.012_250)] text-[oklch(0.38_0.04_250)]',
  'bg-[oklch(0.94_0.02_45)] text-[oklch(0.45_0.07_45)]',
  'bg-[oklch(0.92_0.008_60)] text-[oklch(0.35_0.01_60)]',
]

/** The products table has no image column, so each product gets a deterministic monogram tile. */
export function ProductVisual({
  productId,
  name,
  className,
  size = 'md',
}: {
  productId: number
  name: string
  className?: string
  size?: 'md' | 'lg'
}) {
  const tone = tones[Math.abs(productId) % tones.length]

  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative flex aspect-square items-center justify-center overflow-hidden',
        tone,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.55),transparent_60%)]" />
      <div className="absolute inset-6 rounded-full border border-current opacity-10" />
      <span
        className={cn(
          'relative font-serif tracking-tight',
          size === 'lg' ? 'text-8xl md:text-9xl' : 'text-5xl',
        )}
      >
        {getInitials(name)}
      </span>
      <span className="absolute bottom-3 left-3 font-mono text-[10px] tracking-wider uppercase opacity-60">
        #{String(productId).padStart(4, '0')}
      </span>
    </div>
  )
}
