import type { Metadata } from 'next'
import { ReturnsList } from '@/components/shared/record-lists'
import { PageHeader } from '@/components/shared/page-header'

export const metadata: Metadata = { title: 'Returns' }

export default function ReturnsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader eyebrow="Account" title="Returns" description="Return requests and their current status." />
      <ReturnsList />
    </main>
  )
}
