'use client'

import useSWR from 'swr'
import {
  getAdminCustomerHistory,
  getAdminCustomers,
  getCustomerOrders,
  getCustomerRefunds,
  getCustomerReturns,
  getOrders,
  getProducts,
  getRefunds,
  getReturns,
  type ApiError,
} from '@/lib/api'
import type { ApiRecord, Product } from '@/lib/types'

const options = { revalidateOnFocus: true, revalidateOnReconnect: true, shouldRetryOnError: false }

export function useProducts() {
  return useSWR<Product[], ApiError>('products', getProducts, options)
}

export function useOrders() {
  return useSWR<ApiRecord[], ApiError>('orders', getOrders, options)
}

export function useCustomerOrders(customerId?: number) {
  return useSWR<ApiRecord[], ApiError>(customerId ? ['customer-orders', customerId] : null, () => getCustomerOrders(customerId as number), options)
}

export function useReturns() {
  return useSWR<ApiRecord[], ApiError>('returns', getReturns, options)
}

export function useCustomerReturns(customerId?: number) {
  return useSWR<ApiRecord[], ApiError>(customerId ? ['customer-returns', customerId] : null, () => getCustomerReturns(customerId as number), options)
}

export function useRefunds() {
  return useSWR<ApiRecord[], ApiError>('refunds', getRefunds, options)
}

export function useCustomerRefunds(customerId?: number) {
  return useSWR<ApiRecord[], ApiError>(customerId ? ['customer-refunds', customerId] : null, () => getCustomerRefunds(customerId as number), options)
}

export function useAdminCustomers() {
  return useSWR<ApiRecord[], ApiError>('admin-customers', getAdminCustomers, options)
}

export function useAdminCustomerHistory(customerId?: number) {
  return useSWR<{ customer: Record<string, unknown>; orders: ApiRecord[]; returns: ApiRecord[]; refunds: ApiRecord[] }, ApiError>(
    customerId ? ['admin-customer-history', customerId] : null,
    () => getAdminCustomerHistory(customerId as number),
    options,
  )
}
