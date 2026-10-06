'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { clearCustomerSession, getCustomerSession } from '@/lib/customer-auth'
import type { CustomerProfile } from '@/lib/types'

export default function AccountPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerProfile | null>(null)

  useEffect(() => {
    setCustomer(getCustomerSession())
  }, [])

  const handleLogout = () => {
    clearCustomerSession()
    setCustomer(null)
    router.push('/')
  }

  if (!customer) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Your account</h1>
          <p className="mt-3 text-muted-foreground">Sign in or create an account to access your delivery information and orders.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/account/login" className={buttonVariants() + ' rounded-full'}>
              Sign in
            </Link>
            <Link href="/account/register" className={buttonVariants({ variant: 'outline' }) + ' rounded-full'}>
              Create account
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground">Account profile</p>
          <h1 className="mt-2 text-3xl font-semibold">{customer.name}</h1>
          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{customer.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{customer.phone || 'Not added yet'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivery address</dt>
              <dd className="font-medium whitespace-pre-line">{customer.address || 'Not added yet'}</dd>
            </div>
          </dl>
        </section>

        <aside className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-medium">Account actions</h2>
          <div className="mt-5 flex flex-col gap-3">
            <Link href="/orders" className={buttonVariants({ variant: 'outline' }) + ' justify-center rounded-full'}>
              View orders
            </Link>
            <Link href="/returns" className={buttonVariants({ variant: 'outline' }) + ' justify-center rounded-full'}>
              Returns
            </Link>
            <Link href="/refunds" className={buttonVariants({ variant: 'outline' }) + ' justify-center rounded-full'}>
              Refunds
            </Link>
            <Button variant="outline" onClick={handleLogout} className="justify-center rounded-full">
              Log out
            </Button>
          </div>
        </aside>
      </div>
    </main>
  )
}
