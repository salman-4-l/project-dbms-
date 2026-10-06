import type { Metadata } from 'next'
import { RefundsList } from '@/components/shared/record-lists'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Refunds' }

export default function RefundsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Account"
        title="Refunds"
        description="Refunds are issued against approved returns and recorded here."
      />
      <RefundsList />
    </main>
  )
}
