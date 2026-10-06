'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Receipt, RotateCcw, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StatePanel } from '@/components/shared/api-states'
import { RecordsView } from '@/components/shared/records-view'
import { useCustomerOrders, useCustomerRefunds, useCustomerReturns, useOrders, useRefunds, useReturns } from '@/hooks/use-api'
import { requestReturn } from '@/lib/api'
import { getCustomerSession } from '@/lib/customer-auth'

export function OrdersList() {
  const customer = getCustomerSession()
  const result = customer ? useCustomerOrders(customer.customer_id) : useOrders()
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (result.data && result.data.length > 0 && selectedOrderId === null) {
      setSelectedOrderId(Number(result.data[0].order_id))
    }
  }, [result.data, selectedOrderId])

  if (!customer) {
    return (
      <StatePanel
        icon={Receipt}
        title="Sign in to view your orders"
        description="Your order history is tied to the logged-in customer account."
        action={
          <div className="flex gap-3">
            <Link href="/account/login" className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Sign in
            </Link>
            <Link href="/account/register" className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium">
              Create account
            </Link>
          </div>
        }
      />
    )
  }

  const handleReturnRequest = async () => {
    if (!customer || selectedOrderId === null) return
    if (!reason.trim()) {
      setError('Please provide a return reason.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      await requestReturn({
        customer_id: customer.customer_id,
        order_id: selectedOrderId,
        reason: reason.trim(),
      })
      setSuccess('Return request submitted successfully.')
      setReason('')
      await result.mutate()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not create the return request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <RecordsView
        label="orders"
        result={result}
        emptyIcon={Receipt}
        emptyTitle="No orders found."
        emptyDescription="Orders placed at checkout will be listed here."
      />

      {result.data && result.data.length > 0 && (
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="text-lg font-medium">Request a return</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="return-order-select">Select order</Label>
              <select
                id="return-order-select"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={selectedOrderId ?? ''}
                onChange={(event) => setSelectedOrderId(Number(event.target.value))}
              >
                {result.data.map((order) => (
                  <option key={String(order.order_id)} value={String(order.order_id)}>
                    Order #{order.order_id}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="return-reason">Return reason</Label>
              <Textarea
                id="return-reason"
                rows={3}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Describe the issue with this order"
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          {success && <p className="mt-4 text-sm text-success">{success}</p>}

          <div className="mt-4">
            <Button type="button" onClick={handleReturnRequest} disabled={submitting} className="rounded-full">
              {submitting ? 'Submitting...' : 'Submit return request'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function ReturnsList() {
  const customer = getCustomerSession()
  const result = customer ? useCustomerReturns(customer.customer_id) : useReturns()

  if (!customer) {
    return (
      <StatePanel
        icon={RotateCcw}
        title="Sign in to view returns"
        description="Your return requests are linked to the logged-in customer account."
        action={
          <Link href="/account/login" className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Sign in
          </Link>
        }
      />
    )
  }

  return (
    <RecordsView
      label="returns"
      result={result}
      emptyIcon={RotateCcw}
      emptyTitle="No return requests found."
      emptyDescription="Return requests for your orders will appear here."
    />
  )
}

export function RefundsList() {
  const customer = getCustomerSession()
  const result = customer ? useCustomerRefunds(customer.customer_id) : useRefunds()

  if (!customer) {
    return (
      <StatePanel
        icon={Wallet}
        title="Sign in to view refunds"
        description="Refunds are shown only for your own approved returns."
        action={
          <Link href="/account/login" className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Sign in
          </Link>
        }
      />
    )
  }

  return (
    <RecordsView
      label="refunds"
      result={result}
      emptyIcon={Wallet}
      emptyTitle="No refunds found."
      emptyDescription="Refunds for your approved returns will appear here."
    />
  )
}
