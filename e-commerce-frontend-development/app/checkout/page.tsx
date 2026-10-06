import type { Metadata } from 'next'
import { CheckoutView } from '@/components/checkout/checkout-view'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Checkout' }

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Checkout" title="Complete your order" />
      <CheckoutView />
    </main>
  )
}
