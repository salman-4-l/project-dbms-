import Image from 'next/image'
import Link from 'next/link'
import { PackageCheck, RotateCcw, ShieldCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: PackageCheck,
    title: 'Live inventory',
    description: 'Stock levels come straight from the store database, so what you see is available.',
  },
  {
    icon: RotateCcw,
    title: 'Simple returns',
    description: 'Start a return from your order and follow it through to completion.',
  },
  {
    icon: ShieldCheck,
    title: 'Clear refunds',
    description: 'Every refund is recorded against its return, so you always know where it stands.',
  },
]

export function PromoSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-3xl bg-primary text-primary-foreground md:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 p-8 md:p-14">
          <p className="text-xs font-medium tracking-[0.2em] uppercase opacity-70">
            Shop with confidence
          </p>
          <h2 className="font-serif text-4xl leading-tight tracking-tight text-balance md:text-5xl">
            Ordered today, looked after long after.
          </h2>
          <p className="max-w-md leading-relaxed opacity-75">
            From checkout to returns and refunds, every step of your order is tracked in one place.
          </p>
          <div>
            <Link
              href="/refunds"
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'lg' }),
                'h-11 rounded-full px-6',
              )}
            >
              How refunds work
            </Link>
          </div>
        </div>
        <div className="relative min-h-72">
          <Image
            src="/images/promo.png"
            alt="Shipping boxes tied with twine beside a small plant"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="flex gap-4 rounded-2xl border bg-card p-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <feature.icon className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-medium">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
