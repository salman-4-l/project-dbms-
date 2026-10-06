'use client'

import { Fragment, useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StockBadge } from '@/components/products/stock-badge'
import { ApiErrorState, EmptyState } from '@/components/shared/api-states'
import { useAdminCustomers, useProducts } from '@/hooks/use-api'
import {
  API_BASE_URL,
  ApiError,
  createProduct,
  createRefund,
  deleteProduct,
  ENDPOINTS,
  getAdminCustomerHistory,
  patchRefundStatus,
  patchReturnStatus,
  previewRefund,
  updateProduct,
} from '@/lib/api'
import { formatPrice } from '@/lib/format'
import { cn } from '@/lib/utils'

function describeError(error: unknown) {
  if (error instanceof ApiError && error.kind === 'not-implemented') {
    return `${error.endpoint} isn't available on the backend yet.`
  }
  return error instanceof Error ? error.message : 'Request failed.'
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function AddProductForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ product_name: '', price: '', stock: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = form.product_name.trim()
    const price = Number(form.price)
    const stock = Number(form.stock)

    if (!name) return setFormError('Product name is required.')
    if (!Number.isFinite(price) || price < 0) return setFormError('Price must be a positive number.')
    if (!Number.isInteger(stock) || stock < 0) return setFormError('Stock must be a whole number.')

    setFormError(null)
    setSubmitting(true)
    try {
      await createProduct({ product_name: name, price, stock })
      toast.success('Product added', { description: name })
      setForm({ product_name: '', price: '', stock: '' })
      onCreated()
    } catch (error) {
      setFormError(describeError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <h2 className="font-medium">Add a product</h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-name">Product name</Label>
        <Input
          id="admin-name"
          value={form.product_name}
          onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
          className="h-10"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="admin-price">Price (₹)</Label>
          <Input
            id="admin-price"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            className="h-10"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="admin-stock">Stock</Label>
          <Input
            id="admin-stock"
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            className="h-10"
          />
        </div>
      </div>
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={submitting} className="h-10 rounded-full">
        {submitting ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Plus data-icon="inline-start" />}
        Add product
      </Button>
    </form>
  )
}

function EndpointStatus() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium">Backend endpoints</h2>
        <p className="text-sm text-muted-foreground">
          Connected to <code className="font-mono text-xs text-foreground">{API_BASE_URL}</code>
        </p>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {Object.values(ENDPOINTS).map((endpoint) => (
          <li key={`${endpoint.method} ${endpoint.path}`} className="flex items-center justify-between gap-3">
            <code className="font-mono text-xs">
              <span className="text-muted-foreground">{endpoint.method}</span> {endpoint.path}
            </code>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                endpoint.implemented ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning',
              )}
            >
              {endpoint.implemented ? 'Live' : 'Needed'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminDashboard() {
  const { data, error, isLoading, mutate } = useProducts()
  const customersResult = useAdminCustomers()
  const [pendingDelete, setPendingDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<{ product_name: string; price: string; stock: string } | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
  const [customerHistory, setCustomerHistory] = useState<{
    customer: Record<string, unknown>
    orders: Record<string, unknown>[]
    returns: Record<string, unknown>[]
    refunds: Record<string, unknown>[]
  } | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    if (!customersResult.data || customersResult.data.length === 0) {
      setSelectedCustomerId(null)
      setCustomerHistory(null)
      return
    }

    if (!selectedCustomerId) {
      setSelectedCustomerId(Number(customersResult.data[0].customer_id))
    }
  }, [customersResult.data, selectedCustomerId])

  useEffect(() => {
    if (selectedCustomerId === null) return

    const loadHistory = async () => {
      setHistoryLoading(true)
      try {
        const data = await getAdminCustomerHistory(selectedCustomerId)
        setCustomerHistory(data)
      } catch (historyError) {
        console.error('Could not load customer history', historyError)
        setCustomerHistory(null)
      } finally {
        setHistoryLoading(false)
      }
    }

    loadHistory()
  }, [selectedCustomerId])

  const handleDelete = async (productId: number, name: string) => {
    if (pendingDelete !== productId) return setPendingDelete(productId)
    setDeleting(productId)
    try {
      await deleteProduct(productId)
      toast.success('Product deleted', { description: name })
      await mutate()
    } catch (err) {
      toast.error('Could not delete product', { description: describeError(err) })
    } finally {
      setDeleting(null)
      setPendingDelete(null)
    }
  }

  const beginEdit = (product: { product_id: number; product_name: string; price: number; stock: number }) => {
    setEditingProductId(product.product_id)
    setEditForm({
      product_name: product.product_name,
      price: String(product.price),
      stock: String(product.stock),
    })
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingProductId(null)
    setEditForm(null)
    setEditError(null)
  }

  const handleSaveEdit = async (productId: number) => {
    if (!editForm) return

    const productName = editForm.product_name.trim()
    const price = Number(editForm.price)
    const stock = Number(editForm.stock)

    if (!productName) {
      setEditError('Product name cannot be empty.')
      return
    }

    if (!Number.isFinite(price) || price < 0) {
      setEditError('Price must be a valid number and cannot be negative.')
      return
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setEditError('Stock must be a valid integer and cannot be negative.')
      return
    }

    setSavingEdit(true)
    setEditError(null)

    try {
      await updateProduct(productId, {
        product_name: productName,
        price,
        stock,
      })
      toast.success('Product updated', { description: productName })
      await mutate()
      cancelEdit()
    } catch (err) {
      setEditError(describeError(err))
    } finally {
      setSavingEdit(false)
    }
  }

  const handleApproveReject = async (returnId: number, status: string) => {
    try {
      await patchReturnStatus(returnId, status)
      toast.success('Return updated', { description: status })
      await customersResult.mutate()
      if (selectedCustomerId) {
        const next = await getAdminCustomerHistory(selectedCustomerId)
        setCustomerHistory(next)
      }
    } catch (err) {
      toast.error('Could not update return status', { description: describeError(err) })
    }
  }

  const handleCreateRefund = async (returnId: number) => {
    try {
      const preview = await previewRefund(returnId)
      const confirmed = window.confirm(`Refund amount: ${formatPrice(Number(preview.amount))}. Confirm refund?`)
      if (!confirmed) return

      await createRefund({ return_id: returnId, amount: Number(preview.amount), status: 'Completed' })
      toast.success('Refund created', { description: `Return #${returnId}` })
      if (selectedCustomerId) {
        const next = await getAdminCustomerHistory(selectedCustomerId)
        setCustomerHistory(next)
      }
      await customersResult.mutate()
    } catch (err) {
      toast.error('Could not create refund', { description: describeError(err) })
    }
  }

  const handleRefundStatus = async (refundId: number, status: string) => {
    try {
      await patchRefundStatus(refundId, status)
      toast.success('Refund updated', { description: status })
      if (selectedCustomerId) {
        const next = await getAdminCustomerHistory(selectedCustomerId)
        setCustomerHistory(next)
      }
      await customersResult.mutate()
    } catch (err) {
      toast.error('Could not update refund status', { description: describeError(err) })
    }
  }

  const products = data ?? []
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0)
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length
  const outOfStock = products.filter((p) => p.stock <= 0).length

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Products" value={data ? String(products.length) : '—'} />
        <StatCard label="Inventory value" value={data ? formatPrice(inventoryValue) : '—'} />
        <StatCard label="Low stock" value={data ? String(lowStock) : '—'} />
        <StatCard label="Out of stock" value={data ? String(outOfStock) : '—'} />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <section aria-label="Products" className="min-w-0">
          {isLoading ? (
            <div role="status" aria-label="Loading products" className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-secondary" />
              ))}
            </div>
          ) : error ? (
            <ApiErrorState error={error} onRetry={() => mutate()} />
          ) : products.length === 0 ? (
            <EmptyState title="No products" description="Add your first product using the form." />
          ) : (
            <div className="overflow-hidden rounded-2xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead className="h-11 px-4">ID</TableHead>
                    <TableHead className="h-11 px-4">Product</TableHead>
                    <TableHead className="h-11 px-4 text-right">Price</TableHead>
                    <TableHead className="h-11 px-4 text-right">Stock</TableHead>
                    <TableHead className="h-11 px-4">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <Fragment key={product.product_id}>
                      <TableRow>
                        <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                          #{product.product_id}
                        </TableCell>
                        <TableCell className="px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium">{product.product_name}</span>
                            <StockBadge stock={product.stock} />
                          </div>
                        </TableCell>
                        <TableCell className="px-4 text-right tabular-nums">{formatPrice(product.price)}</TableCell>
                        <TableCell className="px-4 text-right tabular-nums">{product.stock}</TableCell>
                        <TableCell className="px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => beginEdit(product)}
                              disabled={savingEdit || editingProductId === product.product_id}
                            >
                              Edit
                            </Button>
                            <Button
                              variant={pendingDelete === product.product_id ? 'destructive' : 'ghost'}
                              size="sm"
                              disabled={deleting === product.product_id}
                              onBlur={() => pendingDelete === product.product_id && setPendingDelete(null)}
                              onClick={() => handleDelete(product.product_id, product.product_name)}
                              aria-label={
                                pendingDelete === product.product_id
                                  ? `Confirm delete ${product.product_name}`
                                  : `Delete ${product.product_name}`
                              }
                            >
                              {deleting === product.product_id ? (
                                <Loader2 className="animate-spin" />
                              ) : (
                                <Trash2 />
                              )}
                              {pendingDelete === product.product_id && 'Confirm'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {editingProductId === product.product_id && editForm && (
                        <TableRow key={`${product.product_id}-edit`}>
                          <TableCell colSpan={5} className="bg-secondary/20 p-4">
                            <div className="rounded-xl border bg-background p-4">
                              <div className="mb-3 flex items-center justify-between">
                                <h3 className="font-medium">Edit product #{product.product_id}</h3>
                                <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-3">
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor={`edit-name-${product.product_id}`}>Product name</Label>
                                  <Input
                                    id={`edit-name-${product.product_id}`}
                                    value={editForm.product_name}
                                    onChange={(event) =>
                                      setEditForm((current) =>
                                        current ? { ...current, product_name: event.target.value } : current,
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor={`edit-price-${product.product_id}`}>Price</Label>
                                  <Input
                                    id={`edit-price-${product.product_id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.price}
                                    onChange={(event) =>
                                      setEditForm((current) =>
                                        current ? { ...current, price: event.target.value } : current,
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Label htmlFor={`edit-stock-${product.product_id}`}>Stock</Label>
                                  <Input
                                    id={`edit-stock-${product.product_id}`}
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={editForm.stock}
                                    onChange={(event) =>
                                      setEditForm((current) =>
                                        current ? { ...current, stock: event.target.value } : current,
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              {editError && <p className="mt-3 text-sm text-destructive">{editError}</p>}

                              <div className="mt-4 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={cancelEdit} disabled={savingEdit}>
                                  Cancel
                                </Button>
                                <Button type="button" onClick={() => handleSaveEdit(product.product_id)} disabled={savingEdit}>
                                  {savingEdit ? 'Saving...' : 'Save changes'}
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-6 lg:sticky lg:top-32">
          <AddProductForm onCreated={() => mutate()} />
          <EndpointStatus />
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Customers</h2>
        </div>

        {customersResult.isLoading ? (
          <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">Loading customers...</div>
        ) : customersResult.error ? (
          <ApiErrorState error={customersResult.error} onRetry={() => customersResult.mutate()} />
        ) : !customersResult.data || customersResult.data.length === 0 ? (
          <EmptyState title="No customers found." description="No registered customers are available yet." />
        ) : (
          <div className="overflow-hidden rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead className="h-11 px-4">Customer ID</TableHead>
                  <TableHead className="h-11 px-4">Name</TableHead>
                  <TableHead className="h-11 px-4">Email</TableHead>
                  <TableHead className="h-11 px-4">Phone</TableHead>
                  <TableHead className="h-11 px-4">Address</TableHead>
                  <TableHead className="h-11 px-4">History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customersResult.data.map((customer) => (
                  <TableRow key={String(customer.customer_id)}>
                    <TableCell className="px-4 font-mono text-xs text-muted-foreground">#{customer.customer_id}</TableCell>
                    <TableCell className="px-4">{String(customer.name ?? '')}</TableCell>
                    <TableCell className="px-4">{String(customer.email ?? '')}</TableCell>
                    <TableCell className="px-4">{String(customer.phone ?? '') || '—'}</TableCell>
                    <TableCell className="px-4">{String(customer.address ?? '') || '—'}</TableCell>
                    <TableCell className="px-4">
                      <Button variant="outline" size="sm" onClick={() => setSelectedCustomerId(Number(customer.customer_id))}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {selectedCustomerId && (
        <section className="space-y-4 rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Customer history</h2>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">Customer #{selectedCustomerId}</span>
          </div>

          {historyLoading ? (
            <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">Loading customer history...</div>
          ) : !customerHistory ? (
            <EmptyState title="No history available" description="This customer has no saved order or return activity." />
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground">Customer details</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p><p className="font-medium">{String(customerHistory.customer.name ?? '')}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p><p className="font-medium">{String(customerHistory.customer.email ?? '')}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Phone</p><p className="font-medium">{String(customerHistory.customer.phone ?? '—')}</p></div>
                  <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p><p className="font-medium">{String(customerHistory.customer.address ?? '—')}</p></div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">Orders</h3>
                {customerHistory.orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders found.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead className="px-4">Order ID</TableHead>
                          <TableHead className="px-4">Product</TableHead>
                          <TableHead className="px-4">Quantity</TableHead>
                          <TableHead className="px-4">Total</TableHead>
                          <TableHead className="px-4">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerHistory.orders.map((order) => (
                          <TableRow key={String(order.order_id)}>
                            <TableCell className="px-4 font-mono text-xs">#{order.order_id}</TableCell>
                            <TableCell className="px-4">{String(order.product_name ?? '—')}</TableCell>
                            <TableCell className="px-4">{String(order.quantity ?? '—')}</TableCell>
                            <TableCell className="px-4 tabular-nums">{formatPrice(Number(order.total_amount ?? 0))}</TableCell>
                            <TableCell className="px-4">{String(order.status ?? '—')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">Returns</h3>
                {customerHistory.returns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No return requests found.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead className="px-4">Return ID</TableHead>
                          <TableHead className="px-4">Order ID</TableHead>
                          <TableHead className="px-4">Reason</TableHead>
                          <TableHead className="px-4">Status</TableHead>
                          <TableHead className="px-4">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerHistory.returns.map((returnItem) => (
                          <TableRow key={String(returnItem.return_id)}>
                            <TableCell className="px-4 font-mono text-xs">#{returnItem.return_id}</TableCell>
                            <TableCell className="px-4">#{returnItem.order_id}</TableCell>
                            <TableCell className="px-4">{String(returnItem.reason ?? '')}</TableCell>
                            <TableCell className="px-4">{String(returnItem.status ?? 'Requested')}</TableCell>
                            <TableCell className="px-4">
                              {String(returnItem.status ?? '').toLowerCase() === 'requested' && (
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleApproveReject(Number(returnItem.return_id), 'Approved')}>Approve</Button>
                                  <Button variant="outline" size="sm" onClick={() => handleApproveReject(Number(returnItem.return_id), 'Rejected')}>Reject</Button>
                                </div>
                              )}
                              {String(returnItem.status ?? '').toLowerCase() === 'approved' && (
                                <Button variant="outline" size="sm" onClick={() => handleCreateRefund(Number(returnItem.return_id))}>Refund</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium">Refunds</h3>
                {customerHistory.refunds.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No refunds found.</p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                          <TableHead className="px-4">Refund ID</TableHead>
                          <TableHead className="px-4">Return ID</TableHead>
                          <TableHead className="px-4">Amount</TableHead>
                          <TableHead className="px-4">Status</TableHead>
                          <TableHead className="px-4">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerHistory.refunds.map((refund) => (
                          <TableRow key={String(refund.refund_id)}>
                            <TableCell className="px-4 font-mono text-xs">#{refund.refund_id}</TableCell>
                            <TableCell className="px-4">#{refund.return_id}</TableCell>
                            <TableCell className="px-4 tabular-nums">{formatPrice(Number(refund.amount ?? 0))}</TableCell>
                            <TableCell className="px-4">{String(refund.status ?? 'Pending')}</TableCell>
                            <TableCell className="px-4">
                              <Button variant="outline" size="sm" onClick={() => handleRefundStatus(Number(refund.refund_id), 'Completed')}>Mark completed</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
