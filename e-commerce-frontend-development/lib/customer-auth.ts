import type { CustomerProfile } from '@/lib/types'

export const CUSTOMER_SESSION_KEY = 'meridian-customer-session'

export function getCustomerSession(): CustomerProfile | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(CUSTOMER_SESSION_KEY)
    return raw ? (JSON.parse(raw) as CustomerProfile) : null
  } catch {
    return null
  }
}

export function setCustomerSession(customer: CustomerProfile): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(customer))
}

export function clearCustomerSession(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY)
}

export function isCustomerAuthenticated(): boolean {
  return Boolean(getCustomerSession())
}
