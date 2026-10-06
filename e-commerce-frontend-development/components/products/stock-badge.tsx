import { getStockStatus } from '@/lib/format'
import { cn } from '@/lib/utils'

const labels = {
  in: 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
}

export function StockBadge({ stock, showCount = false }: { stock: number; showCount?: boolean }) {
  const status = getStockStatus(stock)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        status === 'in' && 'text-success',
        status === 'low' && 'text-warning',
        status === 'out' && 'text-muted-foreground',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-1.5 rounded-full',
          status === 'in' && 'bg-success',
          status === 'low' && 'bg-warning',
          status === 'out' && 'bg-muted-foreground',
        )}
      />
      {labels[status]}
      {showCount && status !== 'out' && (
        <span className="text-muted-foreground tabular-nums">· {stock} available</span>
      )}
    </span>
  )
}
