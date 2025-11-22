import { ReactNode } from 'react'

export default function ProductsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
          <p className="mt-2 text-muted-foreground">
            Discover our complete collection of AI tools and services
          </p>
        </div>
        {children}
      </main>
    </div>
  )
}
