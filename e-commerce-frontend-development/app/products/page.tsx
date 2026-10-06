import type { Metadata } from 'next'
import { ProductBrowser } from '@/components/products/product-browser'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = {
  title: 'Shop all products',
  description: 'Browse the full Meridian catalogue with live stock and pricing.',
}

function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="The catalogue"
        title="Shop all products"
        description="Every item in the store, with stock levels pulled live from the database."
      />
      <ProductBrowser
        q={firstParam(params.q)}
        range={firstParam(params.range) || 'all'}
        sort={firstParam(params.sort) || 'featured'}
      />
    </main>
  )
}
