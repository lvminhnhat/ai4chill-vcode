import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MOCK_PRODUCTS } from '@/data/mock-products'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductInfo } from '@/components/product/ProductInfo'
import { TrustSignals } from '@/components/product/TrustSignals'
import type { Variant } from '@/types/product'

interface ProductPageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate static params for all products
export async function generateStaticParams() {
  return MOCK_PRODUCTS.map(product => ({
    slug: product.slug,
  }))
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = MOCK_PRODUCTS.find(p => p.slug === slug)

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
    }
  }

  return {
    title: `${product.title} - AI4Chill`,
    description:
      product.description ||
      `Buy ${product.title} at the best price. ${product.category} product with fast delivery.`,
    openGraph: {
      title: product.title,
      description: product.description || `Buy ${product.title} at AI4Chill`,
      images: [
        {
          url: product.image,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description || `Buy ${product.title} at AI4Chill`,
      images: [product.image],
    },
    alternates: {
      canonical: `/products/${product.slug}`,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = MOCK_PRODUCTS.find(p => p.slug === slug)

  if (!product) {
    notFound()
  }

  // Use variants from product or create a default variant
  const variants: Variant[] = product.variants || [
    {
      id: `${product.id}-default`,
      name: 'Standard',
      price: product.price,
      stock: product.stock,
      duration: '1 Month',
      productId: product.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Product Gallery */}
        <div>
          <ProductGallery image={product.image} alt={product.title} />
        </div>

        {/* Product Info */}
        <div>
          <ProductInfo product={product} variants={variants} />
        </div>
      </div>

      {/* Trust Signals */}
      <TrustSignals />
    </div>
  )
}
