'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CircleCheck, Loader2, ShoppingBag } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { OrderSummary } from '@/components/cart/order-summary'
import { ApiErrorState, StatePanel } from '@/components/shared/api-states'
import { createOrder } from '@/lib/api'
import { useCart } from '@/lib/cart-context'
import { getCustomerSession } from '@/lib/customer-auth'
import { formatPrice } from '@/lib/format'
import type { CheckoutCustomer } from '@/lib/types'
import { cn } from '@/lib/utils'

const emptyCustomer: CheckoutCustomer = { name: '', email: '', phone: '', address: '' }

type Status = { type: 'idle' } | { type: 'submitting' } | { type: 'error'; error: unknown } | { type: 'success' }

function validate(customer: CheckoutCustomer) {
  const errors: Partial<Record<keyof CheckoutCustomer, string>> = {}
  if (customer.name.trim().length < 2) errors.name = 'Enter your full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) errors.email = 'Enter a valid email address.'
  if (!/^[+\d][\d\s-]{6,}$/.test(customer.phone.trim())) errors.phone = 'Enter a valid phone number.'
  if (customer.address.trim().length < 8) errors.address = 'Enter your full delivery address.'
  return errors
}

export function CheckoutView() {
  const { items, itemCount, subtotal, hydrated, clearCart } = useCart()
  const sessionCustomer = getCustomerSession()
  const [customer, setCustomer] = useState(emptyCustomer)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutCustomer, string>>>({})
  const [status, setStatus] = useState<Status>({ type: 'idle' })

  if (!hydrated) {
    return <div className="h-96 animate-pulse rounded-2xl bg-secondary" role="status" aria-label="Loading checkout" />
  }

  if (status.type === 'success') {
    return (
      <StatePanel
        icon={CircleCheck}
        title="Order placed"
        description="Thanks for your order. You can follow it from the orders page."
        action={
          <div className="flex gap-3">
            <Link href="/orders" className={cn(buttonVariants(), 'rounded-full')}>
              View orders
            </Link>
            <Link href="/products" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full')}>
              Keep shopping
            </Link>
          </div>
        }
      />
    )
  }

  if (items.length === 0) {
    return (
      <StatePanel
        icon={ShoppingBag}
        title="Nothing to check out"
        description="Add a few products to your cart first."
        action={
          <Link href="/products" className={cn(buttonVariants(), 'rounded-full')}>
            Browse products
          </Link>
        }
      />
    )
  }

  const update = (field: keyof CheckoutCustomer) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setCustomer((current) => ({ ...current, [field]: event.target.value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!sessionCustomer) {
      setStatus({ type: 'error', error: 'Please log in to place an order.' })
      return
    }

    setStatus({ type: 'submitting' })
    try {
      await createOrder({
        customer_id: sessionCustomer.customer_id,
        items: items.map(({ product, quantity }) => ({
          product_id: product.product_id,
          quantity,
          unit_price: product.price,
          total_amount: product.price * quantity,
        })),
        total_amount: subtotal,
        status: 'Pending',
      })
      clearCart()
      setStatus({ type: 'success' })
    } catch (error) {
      setStatus({ type: 'error', error })
    }
  }

  const fields: { key: keyof CheckoutCustomer; label: string; type: string; autoComplete: string }[] = [
    { key: 'name', label: 'Full name', type: 'text', autoComplete: 'name' },
    { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
    { key: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
  ]

  return (
    <form onSubmit={handleSubmit} noValidate className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
      <div className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-5 rounded-2xl border bg-card p-6">
          <legend className="sr-only">Customer delivery details</legend>
          <h2 className="font-medium">Customer &amp; delivery</h2>

          {!sessionCustomer ? (
            <div className="space-y-3 rounded-xl border border-dashed bg-secondary/40 p-4">
              <p className="text-sm text-muted-foreground">
                You need to be logged in before checking out. Use your account to place orders with your stored delivery details.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/account/login" className={cn(buttonVariants(), 'rounded-full')}>
                  Sign in
                </Link>
                <Link href="/account/register" className={cn(buttonVariants({ variant: 'outline' }), 'rounded-full')}>
                  Create account
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border bg-secondary/40 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Logged in as</p>
                <p className="mt-2 text-lg font-medium">{sessionCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{sessionCustomer.email}</p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="checkout-name">Full name</Label>
                  <Input id="checkout-name" value={sessionCustomer.name} readOnly className="h-10 bg-secondary/50" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="checkout-email">Email</Label>
                  <Input id="checkout-email" value={sessionCustomer.email} readOnly className="h-10 bg-secondary/50" />
                </div>
                {sessionCustomer.phone && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="checkout-phone">Phone</Label>
                    <Input id="checkout-phone" value={sessionCustomer.phone} readOnly className="h-10 bg-secondary/50" />
                  </div>
                )}
                {sessionCustomer.address && (
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="checkout-address">Delivery address</Label>
                    <Textarea id="checkout-address" rows={3} value={sessionCustomer.address} readOnly className="bg-secondary/50" />
                  </div>
                )}
              </div>
            </div>
          )}
        </fieldset>

        {status.type === 'error' && <ApiErrorState error={status.error} className="py-10" />}
      </div>

      <div className="lg:sticky lg:top-32">
        <OrderSummary subtotal={subtotal} itemCount={itemCount}>
          <ul className="flex flex-col gap-2 border-t pt-4 text-sm">
            {items.map(({ product, quantity }) => (
              <li key={product.product_id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {product.product_name} <span className="tabular-nums">× {quantity}</span>
                </span>
                <span className="tabular-nums">{formatPrice(product.price * quantity)}</span>
              </li>
            ))}
          </ul>
          <Button type="submit" size="lg" className="h-11 rounded-full" disabled={status.type === 'submitting'}>
            {status.type === 'submitting' && <Loader2 data-icon="inline-start" className="animate-spin" />}
            {status.type === 'submitting' ? 'Placing order…' : `Place order · ${formatPrice(subtotal)}`}
          </Button>
        </OrderSummary>
      </div>
    </form>
  )
}
