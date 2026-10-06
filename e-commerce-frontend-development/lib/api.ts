import type {
  ApiRecord,
  CreateOrderInput,
  CreateProductInput,
  CustomerProfile,
  Product,
} from '@/lib/types'

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export const ENDPOINTS = {
  listProducts: { method: 'GET', path: '/api/products', implemented: true },
  createProduct: { method: 'POST', path: '/api/products', implemented: false },
  updateProduct: { method: 'PUT', path: '/api/products/:product_id', implemented: true },
  deleteProduct: { method: 'DELETE', path: '/api/products/:id', implemented: false },
  listOrders: { method: 'GET', path: '/api/orders', implemented: false },
  createOrder: { method: 'POST', path: '/api/orders', implemented: false },
  listReturns: { method: 'GET', path: '/api/returns', implemented: false },
  listRefunds: { method: 'GET', path: '/api/refunds', implemented: false },
} as const

export type EndpointKey = keyof typeof ENDPOINTS

export type ApiErrorKind = 'network' | 'not-implemented' | 'server' | 'invalid-response'

export class ApiError extends Error {
  constructor(
    message: string,
    public kind: ApiErrorKind,
    public endpoint: string,
    public status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const endpoint = `${method} ${path}`
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(
      `Could not reach the backend at ${API_BASE_URL}. Make sure the Express server is running and CORS is enabled.`,
      'network',
      endpoint,
    )
  }

  if (response.status === 404 || response.status === 405) {
    throw new ApiError(
      `${endpoint} is not implemented on the backend yet.`,
      'not-implemented',
      endpoint,
      response.status,
    )
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      if (response.ok) {
        throw new ApiError(
          `${endpoint} returned a response that is not valid JSON.`,
          'invalid-response',
          endpoint,
          response.status,
        )
      }
    }
  }

  if (!response.ok) {
    const serverMessage =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : response.statusText
    throw new ApiError(
      `${endpoint} failed (${response.status}): ${serverMessage}`,
      'server',
      endpoint,
      response.status,
    )
  }

  return data as T
}

/** MySQL DECIMAL columns arrive as strings through mysql2, so values are normalised here. */
function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    product_id: Number(raw.product_id),
    product_name: String(raw.product_name ?? ''),
    price: Number(raw.price),
    stock: Number(raw.stock),
  }
}

function asArray(data: unknown, endpoint: string): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const nested = Object.values(data).find(Array.isArray)
    if (nested) return nested as Record<string, unknown>[]
  }
  throw new ApiError(`${endpoint} did not return a list.`, 'invalid-response', endpoint)
}

export async function getProducts(): Promise<Product[]> {
  const data = await request<unknown>('GET', '/api/products')
  return asArray(data, 'GET /api/products').map(normalizeProduct)
}

/** Requires POST /api/products on the Express backend. */
export async function createProduct(input: CreateProductInput): Promise<unknown> {
  return request('POST', '/api/products', input)
}

/** Requires DELETE /api/products/:id on the Express backend. */
export async function updateProduct(productId: number, input: Partial<CreateProductInput>): Promise<Product> {
  return normalizeProduct(await request<Record<string, unknown>>('PUT', `/api/products/${encodeURIComponent(productId)}`, input))
}

/** Requires DELETE /api/products/:id on the Express backend. */
export async function deleteProduct(productId: number): Promise<unknown> {
  return request('DELETE', `/api/products/${encodeURIComponent(productId)}`)
}

/** Requires POST /api/orders on the Express backend. */
export async function registerCustomer(input: {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
}): Promise<{ customer: CustomerProfile }> {
  return request('POST', '/api/customers/register', input)
}

export async function loginCustomer(input: { email: string; password: string }): Promise<{ customer: CustomerProfile }> {
  return request('POST', '/api/customers/login', input)
}

export async function createOrder(input: CreateOrderInput): Promise<unknown> {
  return request('POST', '/api/orders', input)
}

export async function getCustomerProfile(customerId: number): Promise<{ customer: CustomerProfile }> {
  return request('GET', `/api/customers/${encodeURIComponent(customerId)}`)
}

export async function getCustomerOrders(customerId: number): Promise<ApiRecord[]> {
  return asArray(await request<unknown>('GET', `/api/customers/${encodeURIComponent(customerId)}/orders`), 'GET /api/customers/:id/orders')
}

export async function getCustomerReturns(customerId: number): Promise<ApiRecord[]> {
  return asArray(await request<unknown>('GET', `/api/customers/${encodeURIComponent(customerId)}/returns`), 'GET /api/customers/:id/returns')
}

export async function getCustomerRefunds(customerId: number): Promise<ApiRecord[]> {
  return asArray(await request<unknown>('GET', `/api/customers/${encodeURIComponent(customerId)}/refunds`), 'GET /api/customers/:id/refunds')
}

export async function requestReturn(input: { customer_id: number; order_id: number; reason: string }): Promise<ApiRecord> {
  return request('POST', '/api/returns', input)
}

export async function getAdminCustomers(): Promise<ApiRecord[]> {
  return asArray(await request<unknown>('GET', '/api/customers'), 'GET /api/customers')
}

export async function getAdminCustomerHistory(customerId: number): Promise<{
  customer: CustomerProfile
  orders: ApiRecord[]
  returns: ApiRecord[]
  refunds: ApiRecord[]
}> {
  return request('GET', `/api/customers/${encodeURIComponent(customerId)}/history`)
}

export async function getOrders(): Promise<ApiRecord[]> {
  return asArray(await request<unknown>('GET', '/api/orders'), 'GET /api/orders')
}

export async function getReturns(): Promise<ApiRecord[]> {
  return asArray(await request<unknown>('GET', '/api/returns'), 'GET /api/returns')
}

export async function getRefunds(): Promise<ApiRecord[]> {
  return asArray(await request<unknown>('GET', '/api/refunds'), 'GET /api/refunds')
}

export async function patchReturnStatus(returnId: number, status: string): Promise<ApiRecord> {
  return request('PATCH', `/api/returns/${encodeURIComponent(returnId)}/status`, { status })
}

export async function previewRefund(returnId: number): Promise<{ amount: number; customer_id: number; return_id: number }> {
  return request('GET', `/api/refunds/preview?return_id=${encodeURIComponent(returnId)}`)
}

export async function createRefund(input: { customer_id?: number; return_id: number; amount?: number; status?: string }): Promise<ApiRecord> {
  return request('POST', '/api/refunds', input)
}

export async function patchRefundStatus(refundId: number, status: string): Promise<ApiRecord> {
  return request('PATCH', `/api/refunds/${encodeURIComponent(refundId)}/status`, { status })
}
