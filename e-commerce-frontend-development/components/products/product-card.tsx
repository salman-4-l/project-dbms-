'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ProductVisual } from '@/components/products/product-visual'
import { StockBadge } from '@/components/products/stock-badge'
import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const soldOut = product.stock <= 0
  const href = `/products/${product.product_id}`

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_oklch(0.2_0.01_60/0.25)]">
      <Link href={href} className="block overflow-hidden" tabIndex={-1} aria-hidden="true">
        <ProductVisual
          productId={product.product_id}
          name={product.product_name}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1">
          <StockBadge stock={product.stock} />
          <h3 className="line-clamp-2 font-medium leading-snug text-pretty">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {product.product_name}
            </Link>
          </h3>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-lg font-semibold tabular-nums">{formatPrice(product.price)}</p>
          <Button
            size="icon-lg"
            variant={soldOut ? 'secondary' : 'default'}
            disabled={soldOut}
            aria-label={soldOut ? `${product.product_name} is out of stock` : `Add ${product.product_name} to cart`}
            className="relative z-10 rounded-full"
            onClick={() => {
              addItem(product)
              toast.success('Added to cart', { description: product.product_name })
            }}
          >
            <Plus />
          </Button>
        </div>
      </div>
    </article>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card" aria-hidden="true">
      <div className="aspect-square animate-pulse bg-secondary" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-20 animate-pulse rounded bg-secondary" />
          <div className="size-9 animate-pulse rounded-full bg-secondary" />
        </div>
      </div>
    </div>
  )
}
