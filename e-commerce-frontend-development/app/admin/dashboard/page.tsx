import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export const metadata: Metadata = {
  title: 'Admin dashboard',
  robots: { index: false },
}

export default function AdminDashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Operations dashboard"
        description="Manage products and inventory through the existing Express API connected to the ecommerce_db database."
      />
      <AdminDashboard />
    </main>
  )
}
