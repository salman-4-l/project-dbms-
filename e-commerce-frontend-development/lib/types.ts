export interface Product {
  product_id: number
  product_name: string
  price: number
  stock: number
}

export type CreateProductInput = Omit<Product, 'product_id'>

export interface CartItem {
  product: Product
  quantity: number
}

export interface CheckoutCustomer {
  name: string
  email: string
  phone: string
  address: string
}

export interface CustomerProfile {
  customer_id: number
  name: string
  email: string
  phone?: string
  address?: string
}

export interface CreateOrderInput {
  customer_id?: number
  customer?: CheckoutCustomer
  items: { product_id: number; quantity: number; unit_price?: number; total_amount?: number }[]
  total_amount?: number
  status?: string
}

/**
 * The shape of orders, returns and refunds is defined by the backend.
 * Rows are rendered generically so the UI never assumes columns that
 * the MySQL tables may not have.
 */
export type ApiRecord = Record<string, unknown>
