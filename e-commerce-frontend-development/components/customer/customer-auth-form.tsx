'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { loginCustomer, registerCustomer } from '@/lib/api'
import { setCustomerSession } from '@/lib/customer-auth'

export function CustomerAuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response =
        mode === 'login'
          ? await loginCustomer({ email: form.email.trim(), password: form.password })
          : await registerCustomer({
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              phone: form.phone.trim(),
              address: form.address.trim(),
            })

      setCustomerSession(response.customer)
      router.push('/account')
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to continue.'
      setError(message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{mode === 'login' ? 'Customer sign in' : 'Create your account'}</h2>
        <p className="text-sm text-muted-foreground">
          {mode === 'login'
            ? 'Use the same email and password you registered with to access your orders and address details.'
            : 'Create a customer account to save your profile and use it automatically at checkout.'}
        </p>
      </div>

      {mode === 'register' && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="customer-name">Full name</Label>
          <Input
            id="customer-name"
            value={form.name}
            onChange={updateField('name')}
            placeholder="Enter your full name"
            className="h-11"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-email">Email</Label>
        <Input
          id="customer-email"
          type="email"
          value={form.email}
          onChange={updateField('email')}
          placeholder="you@example.com"
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-password">Password</Label>
        <Input
          id="customer-password"
          type="password"
          value={form.password}
          onChange={updateField('password')}
          placeholder={mode === 'login' ? 'Enter your password' : 'Choose a secure password'}
          className="h-11"
        />
      </div>

      {mode === 'register' && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-phone">Phone</Label>
            <Input
              id="customer-phone"
              value={form.phone}
              onChange={updateField('phone')}
              placeholder="+1 555 123 4567"
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="customer-address">Address</Label>
            <Textarea
              id="customer-address"
              rows={3}
              value={form.address}
              onChange={updateField('address')}
              placeholder="Street, city, country"
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <Button type="submit" disabled={submitting} className="h-11 rounded-full">
          {submitting ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>

        <Link href={mode === 'login' ? '/account/register' : '/account/login'} className="text-sm text-muted-foreground hover:text-foreground">
          {mode === 'login' ? 'Need an account?' : 'Already registered?'}
        </Link>
      </div>
    </form>
  )
}
