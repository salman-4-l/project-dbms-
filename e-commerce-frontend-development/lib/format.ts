const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
})

export function formatPrice(value: number) {
  return Number.isFinite(value) ? currency.format(value) : '—'
}

export function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  return words
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

export type StockStatus = 'out' | 'low' | 'in'

export function getStockStatus(stock: number): StockStatus {
  if (stock <= 0) return 'out'
  if (stock <= 10) return 'low'
  return 'in'
}

export function humanizeKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

const MONEY_KEY = /(price|amount|total|refund_amount|cost)/i
const DATE_KEY = /(date|_at$|time)/i

export function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (MONEY_KEY.test(key) && !Number.isNaN(Number(value))) return formatPrice(Number(value))
  if (DATE_KEY.test(key) && typeof value === 'string') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
