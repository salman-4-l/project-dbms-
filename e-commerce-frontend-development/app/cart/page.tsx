import type { Metadata } from 'next'
import { CartView } from '@/components/cart/cart-view'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Your cart' }

export default function CartPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Cart" title="Your cart" />
      <CartView />
    </main>
  )
}
