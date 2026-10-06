'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, PackageCheck, RotateCcw, SearchX, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { ProductVisual } from '@/components/products/product-visual'
import { StockBadge } from '@/components/products/stock-badge'
import { ProductGrid } from '@/components/products/product-grid'
import { ApiErrorState, StatePanel } from '@/components/shared/api-states'
import { QuantityStepper } from '@/components/shared/quantity-stepper'
import { useProducts } from '@/hooks/use-api'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading product" className="grid gap-10 md:grid-cols-2">
      <div className="aspect-square animate-pulse rounded-3xl bg-secondary" />
      <div className="flex flex-col gap-4 pt-4">
        <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="h-8 w-32 animate-pulse rounded bg-secondary" />
        <div className="mt-6 h-12 w-full animate-pulse rounded-full bg-secondary" />
      </div>
    </div>
  )
}

export function ProductDetail({ productId }: { productId: number }) {
  const router = useRouter()
  const { data, error, isLoading, mutate } = useProducts()
  const { addItem, items } = useCart()
  const [quantity, setQuantity] = useState(1)

  if (isLoading) return <DetailSkeleton />
  if (error) return <ApiErrorState error={error} onRetry={() => mutate()} />

  const product = data?.find((item) => item.product_id === productId)

  if (!product) {
    return (
      <StatePanel
        icon={SearchX}
        title="Product not found"
        description="This product may have been removed from the catalogue."
        action={
          <Link href="/products" className={buttonVariants({ variant: 'outline' })}>
            Back to the shop
          </Link>
        }
      />
    )
  }

  const inCart = items.find((item) => item.product.product_id === product.product_id)?.quantity ?? 0
  const remaining = Math.max(product.stock - inCart, 0)
  const soldOut = product.stock <= 0
  const related = (data ?? []).filter((item) => item.product_id !== product.product_id).slice(0, 4)

  const handleAdd = () => {
    addItem(product, quantity)
    toast.success(`Added ${quantity} × ${product.product_name}`, {
      action: { label: 'View cart', onClick: () => router.push('/cart') },
    })
    setQuantity(1)
  }

  return (
    <div className="flex flex-col gap-24">
      <div className="grid gap-8 md:grid-cols-2 md:gap-14">
        <ProductVisual
          productId={product.product_id}
          name={product.product_name}
          size="lg"
          className="rounded-3xl"
        />

        <div className="flex flex-col gap-8 md:py-6">
          <div className="flex flex-col gap-4">
            <StockBadge stock={product.stock} showCount />
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-balance md:text-5xl">
              {product.product_name}
            </h1>
            <p className="text-3xl font-semibold tabular-nums">{formatPrice(product.price)}</p>
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border text-sm">
            <div className="flex flex-col gap-1 bg-card p-4">
              <dt className="text-muted-foreground">Product ID</dt>
              <dd className="font-mono">#{product.product_id}</dd>
            </div>
            <div className="flex flex-col gap-1 bg-card p-4">
              <dt className="text-muted-foreground">Units in stock</dt>
              <dd className="tabular-nums">{product.stock}</dd>
            </div>
          </dl>

          {soldOut ? (
            <Button size="lg" disabled className="h-12 rounded-full">
              Out of stock
            </Button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <QuantityStepper
                  label="Quantity"
                  value={Math.min(quantity, Math.max(remaining, 1))}
                  max={Math.max(remaining, 1)}
                  onChange={setQuantity}
                />
                <Button
                  size="lg"
                  className="h-11 flex-1 rounded-full"
                  onClick={handleAdd}
                  disabled={remaining === 0}
                >
                  <ShoppingBag data-icon="inline-start" />
                  {remaining === 0 ? 'All stock in cart' : 'Add to cart'}
                </Button>
              </div>
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-full"
                disabled={remaining === 0}
                onClick={() => {
                  addItem(product, quantity)
                  router.push('/checkout')
                }}
              >
                Buy now
              </Button>
              {inCart > 0 && (
                <p className="text-sm text-muted-foreground">
                  You have {inCart} in your{' '}
                  <Link href="/cart" className="font-medium text-foreground underline underline-offset-4">
                    cart
                  </Link>
                  .
                </p>
              )}
            </div>
          )}

          <ul className="flex flex-col gap-3 border-t pt-6 text-sm text-muted-foreground">
            <li className="flex items-center gap-3">
              <PackageCheck className="size-4 text-foreground" aria-hidden="true" />
              Stock reserved when your order is placed
            </li>
            <li className="flex items-center gap-3">
              <RotateCcw className="size-4 text-foreground" aria-hidden="true" />
              Returns can be requested from your order
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="flex flex-col gap-8">
          <h2 className="font-serif text-3xl tracking-tight">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}

export function BackToShop() {
  return (
    <Link
      href="/products"
      className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2.5 text-muted-foreground')}
    >
      <ArrowLeft data-icon="inline-start" />
      All products
    </Link>
  )
}
