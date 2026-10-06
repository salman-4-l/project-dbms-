import { Hero } from '@/components/home/hero'
import { AllProductsPreview, LatestProducts } from '@/components/home/product-section'
import { PromoSection } from '@/components/home/promo-section'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <LatestProducts />
      <PromoSection />
      <AllProductsPreview />
    </main>
  )
}
