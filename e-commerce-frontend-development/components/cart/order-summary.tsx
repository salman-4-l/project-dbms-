import { formatPrice } from '@/lib/format'

export function OrderSummary({
  subtotal,
  itemCount,
  children,
}: {
  subtotal: number
  itemCount: number
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
      <h2 className="font-medium">Order summary</h2>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </dt>
          <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Shipping</dt>
          <dd>Free</dd>
        </div>
        <div className="flex justify-between border-t pt-3 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
      </dl>
      {children}
    </div>
  )
}
