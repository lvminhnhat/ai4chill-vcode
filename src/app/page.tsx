import { HeroSection, TrustBar, FeaturedProducts } from '@/components'

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <TrustBar />
      <section id="products" className="scroll-mt-20">
        <FeaturedProducts />
      </section>
    </main>
  )
}
