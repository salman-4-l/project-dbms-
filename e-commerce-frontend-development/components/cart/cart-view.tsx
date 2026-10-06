'use client'

import Link from 'next/link'
import { ArrowRight, ShoppingBag, Trash2 } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { OrderSummary } from '@/components/cart/order-summary'
import { ProductVisual } from '@/components/products/product-visual'
import { StatePanel } from '@/components/shared/api-states'
import { QuantityStepper } from '@/components/shared/quantity-stepper'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

export function CartView() {
  const { items, itemCount, subtotal, hydrated, setQuantity, removeItem, clearCart } = useCart()

  if (!hydrated) {
    return <div className="h-64 animate-pulse rounded-2xl bg-secondary" role="status" aria-label="Loading cart" />
  }

  if (items.length === 0) {
    return (
      <StatePanel
        icon={ShoppingBag}
        title="Your cart is empty"
        description="Products you add will show up here, ready for checkout."
        action={
          <Link href="/products" className={cn(buttonVariants(), 'rounded-full')}>
            Start shopping
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <section aria-labelledby="cart-items-heading" className="rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 id="cart-items-heading" className="font-medium">
            Items
          </h2>
          <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground">
            Clear cart
          </Button>
        </div>
        <ul className="divide-y">
          {items.map(({ product, quantity }) => (
            <li key={product.product_id} className="flex gap-4 p-5">
              <Link href={`/products/${product.product_id}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
                <ProductVisual
                  productId={product.product_id}
                  name={product.product_name}
                  className="size-20 rounded-xl [&_span:first-of-type]:text-2xl [&_span:last-child]:hidden sm:size-24"
                />
              </Link>
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <Link href={`/products/${product.product_id}`} className="font-medium hover:underline underline-offset-4">
                    {product.product_name}
                  </Link>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {formatPrice(product.price)} each
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <QuantityStepper
                    size="sm"
                    label={`Quantity of ${product.product_name}`}
                    value={quantity}
                    max={product.stock}
                    onChange={(value) => setQuantity(product.product_id, value)}
                  />
                  <p className="w-24 text-right font-semibold tabular-nums">
                    {formatPrice(product.price * quantity)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${product.product_name}`}
                    onClick={() => removeItem(product.product_id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="lg:sticky lg:top-32">
        <OrderSummary subtotal={subtotal} itemCount={itemCount}>
          <Link href="/checkout" className={cn(buttonVariants({ size: 'lg' }), 'h-11 rounded-full')}>
            Proceed to checkout
            <ArrowRight data-icon="inline-end" />
          </Link>
          <Link
            href="/products"
            className="text-center text-sm text-muted-foreground hover:text-foreground"
          >
            Continue shopping
          </Link>
        </OrderSummary>
      </div>
    </div>
  )
}
