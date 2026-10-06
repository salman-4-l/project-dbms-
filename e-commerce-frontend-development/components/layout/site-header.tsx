'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Search, ShoppingBag, UserCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Logo } from '@/components/layout/logo'
import { useCart } from '@/lib/cart-context'
import { clearCustomerSession, getCustomerSession } from '@/lib/customer-auth'
import { cn } from '@/lib/utils'

const primaryNav = [
  { href: '/products', label: 'Shop' },
  { href: '/orders', label: 'Orders' },
  { href: '/returns', label: 'Returns' },
  { href: '/refunds', label: 'Refunds' },
]

export const shopCategories = [
  { value: 'all', label: 'All products' },
  { value: 'in-stock', label: 'In stock' },
  { value: 'under-1000', label: 'Under ₹1,000' },
  { value: '1000-5000', label: '₹1,000 – ₹5,000' },
  { value: 'over-5000', label: 'Premium ₹5,000+' },
]

function SearchForm({ className, onSubmitted }: { className?: string; onSubmitted?: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(event) => {
        event.preventDefault()
        const q = query.trim()
        router.push(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
        onSubmitted?.()
      }}
    >
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id="site-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products"
        className="h-10 rounded-full bg-secondary pl-9 border-transparent focus-visible:bg-card"
      />
    </form>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { itemCount, hydrated } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [customer, setCustomer] = useState<ReturnType<typeof getCustomerSession>>(null)

  useEffect(() => {
    setCustomer(getCustomerSession())
  }, [pathname])

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const accountHref = customer ? '/account' : '/account/login'
  const accountLabel = customer ? (customer.name ? customer.name.split(' ')[0] : 'Account') : 'Login'

  const handleLogout = () => {
    clearCustomerSession()
    setCustomer(null)
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon-lg" className="lg:hidden" aria-label="Open menu" />
            }
          >
            <Menu />
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4">
              <SearchForm onSubmitted={() => setMobileOpen(false)} />
              <nav aria-label="Mobile" className="flex flex-col gap-1">
                {[{ href: '/', label: 'Home' }, ...primaryNav].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-secondary',
                      (item.href === '/' ? pathname === '/' : isActive(item.href)) &&
                        'bg-secondary',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-1">
                <Link
                  href={accountHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-secondary"
                >
                  <UserCircle2 className="size-4" aria-hidden="true" />
                  {accountLabel}
                </Link>
                {customer && (
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                    className="rounded-lg px-3 py-2 text-left text-base font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    Log out
                  </button>
                )}
                <p className="px-3 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Shop by
                </p>
                {shopCategories.map((category) => (
                  <Link
                    key={category.value}
                    href={`/products?range=${category.value}`}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {category.label}
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link href="/" aria-label="Meridian home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                isActive(item.href) && 'bg-secondary text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <SearchForm className="ml-auto hidden w-full max-w-xs md:block" />

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={accountHref}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <UserCircle2 className="size-4" aria-hidden="true" />
            {accountLabel}
          </Link>
          {customer && (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 rounded-full px-3">
              Log out
            </Button>
          )}
        </div>

        <Link
          href="/cart"
          aria-label={`Cart, ${hydrated ? itemCount : 0} items`}
          className="relative ml-auto inline-flex size-10 items-center justify-center rounded-full transition-colors hover:bg-secondary md:ml-0"
        >
          <ShoppingBag className="size-5" aria-hidden="true" />
          {hydrated && itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-brand-foreground tabular-nums">
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </Link>
      </div>

      <div className="hidden border-t md:block">
        <nav
          aria-label="Shop by price and availability"
          className="mx-auto flex h-11 max-w-7xl items-center gap-6 overflow-x-auto px-4 text-sm sm:px-6 lg:px-8"
        >
          {shopCategories.map((category) => (
            <Link
              key={category.value}
              href={`/products?range=${category.value}`}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              {category.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
