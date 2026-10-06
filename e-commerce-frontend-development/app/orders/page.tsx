import type { Metadata } from 'next'
import { OrdersList } from '@/components/shared/record-lists'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Orders' }

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Account" title="Orders" description="Every order recorded in the store." />
      <OrdersList />
    </main>
  )
}
