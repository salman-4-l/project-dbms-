'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductGrid, ProductGridSkeleton } from '@/components/products/product-grid'
import { ApiErrorState, EmptyState } from '@/components/shared/api-states'
import { useProducts } from '@/hooks/use-api'
import type { Product } from '@/lib/types'

interface ProductSectionProps {
  eyebrow: string
  title: string
  href: string
  limit: number
  select: (products: Product[]) => Product[]
}

export function ProductSection({ eyebrow, title, href, limit, select }: ProductSectionProps) {
  const { data, error, isLoading, mutate } = useProducts()
  const products = data ? select(data).slice(0, limit) : []

  return (
    <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">{title}</h2>
        </div>
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium"
        >
          View all
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={limit} />
      ) : error ? (
        <ApiErrorState error={error} onRetry={() => mutate()} />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Products added to the products table will appear here automatically."
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </section>
  )
}

export function LatestProducts() {
  return (
    <ProductSection
      eyebrow="Featured"
      title="Latest additions"
      href="/products?sort=newest"
      limit={4}
      select={(products) =>
        [...products].filter((p) => p.stock > 0).sort((a, b) => b.product_id - a.product_id)
      }
    />
  )
}

export function AllProductsPreview() {
  return (
    <ProductSection
      eyebrow="The catalogue"
      title="Shop everything"
      href="/products"
      limit={8}
      select={(products) => [...products].sort((a, b) => a.product_id - b.product_id)}
    />
  )
}
