'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductGrid, ProductGridSkeleton } from '@/components/products/product-grid'
import { ApiErrorState, EmptyState } from '@/components/shared/api-states'
import { shopCategories } from '@/components/layout/site-header'
import { useProducts } from '@/hooks/use-api'
import type { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A–Z' },
]

function matchesRange(product: Product, range: string) {
  switch (range) {
    case 'in-stock':
      return product.stock > 0
    case 'under-1000':
      return product.price < 1000
    case '1000-5000':
      return product.price >= 1000 && product.price <= 5000
    case 'over-5000':
      return product.price > 5000
    default:
      return true
  }
}

function sortProducts(products: Product[], sort: string) {
  const sorted = [...products]
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => b.product_id - a.product_id)
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price)
    case 'name':
      return sorted.sort((a, b) => a.product_name.localeCompare(b.product_name))
    default:
      return sorted.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0) || a.product_id - b.product_id)
  }
}

export function ProductBrowser({ q, range, sort }: { q: string; range: string; sort: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [query, setQuery] = useState(q)
  const [lastQ, setLastQ] = useState(q)
  const { data, error, isLoading, mutate } = useProducts()

  if (q !== lastQ) {
    setLastQ(q)
    setQuery(q)
  }

  const updateParams = (next: Partial<{ q: string; range: string; sort: string }>) => {
    const params = new URLSearchParams()
    const merged = { q, range, sort, ...next }
    if (merged.q) params.set('q', merged.q)
    if (merged.range && merged.range !== 'all') params.set('range', merged.range)
    if (merged.sort && merged.sort !== 'featured') params.set('sort', merged.sort)
    const search = params.toString()
    startTransition(() => router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false }))
  }

  const products = useMemo(() => {
    if (!data) return []
    const needle = query.trim().toLowerCase()
    return sortProducts(
      data.filter(
        (product) =>
          matchesRange(product, range) &&
          (!needle || product.product_name.toLowerCase().includes(needle)),
      ),
      sort,
    )
  }, [data, query, range, sort])

  const hasFilters = Boolean(query.trim()) || (range && range !== 'all')

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" role="group" aria-label="Filter products">
          {shopCategories.map((category) => {
            const active = (range || 'all') === category.value
            return (
              <button
                key={category.value}
                type="button"
                aria-pressed={active}
                onClick={() => updateParams({ range: category.value })}
                className={cn(
                  'h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {category.label}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2">
          <form
            role="search"
            className="relative flex-1 lg:w-64"
            onSubmit={(event) => {
              event.preventDefault()
              updateParams({ q: query.trim() })
            }}
          >
            <label htmlFor="catalogue-search" className="sr-only">
              Search the catalogue
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="catalogue-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onBlur={() => query.trim() !== q && updateParams({ q: query.trim() })}
              placeholder="Search by name"
              className="h-9 rounded-full bg-card pl-9"
            />
          </form>
          <label htmlFor="catalogue-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="catalogue-sort"
            value={sort || 'featured'}
            onChange={(event) => updateParams({ sort: event.target.value })}
            className="h-9 rounded-full border bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <ProductGridSkeleton />
      ) : error ? (
        <ApiErrorState error={error} onRetry={() => mutate()} />
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p aria-live="polite">
              {products.length} {products.length === 1 ? 'product' : 'products'}
            </p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('')
                  updateParams({ q: '', range: 'all' })
                }}
              >
                <X data-icon="inline-start" />
                Clear filters
              </Button>
            )}
          </div>
          {products.length === 0 ? (
            <EmptyState
              title={data?.length ? 'No matching products' : 'The catalogue is empty'}
              description={
                data?.length
                  ? 'Try a different search term or remove a filter.'
                  : 'Products added to the database will appear here.'
              }
            />
          ) : (
            <ProductGrid products={products} />
          )}
        </>
      )}
    </div>
  )
}
