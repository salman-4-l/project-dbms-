import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-secondary">
        <Image
          src="/images/hero.png"
          alt="A curated arrangement of everyday goods on a stone surface"
          fill
          priority
          sizes="(min-width: 1280px) 1216px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent md:via-background/40" />
        <div className="relative flex min-h-[460px] max-w-xl flex-col justify-center gap-6 p-8 md:min-h-[540px] md:p-14">
          <p className="text-xs font-medium tracking-[0.2em] text-brand uppercase">
            The everyday collection
          </p>
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-balance md:text-7xl">
            Goods made to be used, every single day.
          </h1>
          <p className="max-w-md leading-relaxed text-pretty text-muted-foreground">
            Browse the full catalogue with live stock levels, straightforward pricing and simple
            returns.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/products"
              className={cn(buttonVariants({ size: 'lg' }), 'h-11 rounded-full px-6')}
            >
              Shop the catalogue
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link
              href="/products?range=in-stock"
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'h-11 rounded-full bg-background/70 px-6',
              )}
            >
              Ready to ship
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
