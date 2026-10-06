import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'
import { CustomerAuthForm } from '@/components/customer/customer-auth-form'

export const metadata: Metadata = {
  title: 'Customer login',
  robots: { index: false },
}

export default function CustomerLoginPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Account"
        title="Customer sign in"
        description="Access your profile, order history and checkout details using your customer account."
      />
      <CustomerAuthForm mode="login" />
    </main>
  )
}
