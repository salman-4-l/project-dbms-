import { notFound } from 'next/navigation'
import { BackToShop, ProductDetail } from '@/components/products/product-detail'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) notFound()

  return (
    <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <BackToShop />
      </div>
      <ProductDetail productId={productId} />
    </main>
  )
}
