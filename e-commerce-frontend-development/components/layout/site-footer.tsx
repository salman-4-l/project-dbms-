import Link from 'next/link'
import { Logo } from '@/components/layout/logo'

const columns = [
  {
    title: 'Shop',
    links: [
      { href: '/products', label: 'All products' },
      { href: '/products?range=in-stock', label: 'In stock' },
      { href: '/products?sort=price-asc', label: 'Lowest price' },
      { href: '/cart', label: 'Cart' },
    ],
  },
  {
    title: 'Help',
    links: [
      { href: '/orders', label: 'Your orders' },
      { href: '/returns', label: 'Returns' },
      { href: '/refunds', label: 'Refund information' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/returns', label: 'Returns' },
      { href: '/refunds', label: 'Refund information' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)] lg:px-8">
        <div className="flex max-w-xs flex-col gap-4">
          <Logo />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Everyday goods with live inventory, served by an Express REST API backed by MySQL.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h2 className="text-sm font-medium">{column.title}</h2>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Meridian. DBMS academic project.</p>
          <p>Frontend → Express REST API → MySQL (ecommerce_db)</p>
        </div>
      </div>
    </footer>
  )
}
