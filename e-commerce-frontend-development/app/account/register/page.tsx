import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/page-header'
import { CustomerAuthForm } from '@/components/customer/customer-auth-form'

export const metadata: Metadata = {
  title: 'Create account',
  robots: { index: false },
}

export default function CustomerRegisterPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Account"
        title="Create a customer account"
        description="Register once and your details will be reused automatically during checkout."
      />
      <CustomerAuthForm mode="register" />
    </main>
  )
}
