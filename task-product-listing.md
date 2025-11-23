# Task: Create Product Listing Page for Issue #27 Phase 2

## Context

- Issue #27: Shopping & Checkout Flow - Product Discovery to Cart
- Phase 2: Product Listing Page with filters and sort
- Use mock data from src/data/mock-products.ts
- Cart functionality already working from Phase 1

## Technical Requirements

### 1. Update mock-products.ts

- Add category field to each product
- Infer categories:
  - ChatGPT/Claude/Gemini = "AI Chat"
  - DALL-E/Midjourney = "AI Art"
  - GitHub Copilot = "AI Coding"
- Update Product type to include category field

### 2. Create Products page (src/app/products/page.tsx)

- Server Component that fetches products
- Support URL params for filtering: ?category=AI+Chat&sort=price-asc
- Filter logic: by category
- Sort logic: price-asc, price-desc, newest
- Pass filtered/sorted products to ProductGrid component

### 3. Create ProductGrid component (src/components/product/ProductGrid.tsx)

- Client Component
- Responsive grid layout (1 col mobile, 2 cols tablet, 3-4 cols desktop)
- Use existing ProductCard component
- Wire onAddToCart to useCart().addItem()
- Loading skeletons
- Empty state message

### 4. Create ProductFilters component (src/components/product/ProductFilters.tsx)

- Client Component
- Category filter: checkboxes for "AI Chat", "AI Art", "AI Coding"
- Sort dropdown: Price (Low to High), Price (High to Low), Newest
- Use URL params (useSearchParams, useRouter from next/navigation)
- Update URL when filter/sort changes
- Mobile: drawer/sheet, Desktop: sidebar
- Clear filters button

### 5. Create layout for products page (src/app/products/layout.tsx)

- Optional: breadcrumb navigation
- Page title "All Products"

## Implementation Details

### File Structure

```
src/app/products/
├── layout.tsx
└── page.tsx

src/components/product/
├── ProductGrid.tsx
└── ProductFilters.tsx
```

### URL Examples

- /products - all products
- /products?category=AI+Chat - filter by category
- /products?sort=price-asc - sort by price
- /products?category=AI+Art&sort=price-desc - combined

### Technical Stack

- TypeScript strict mode
- Mobile responsive
- Use existing UI components (Button, Card, Sheet, etc.)
- Follow existing patterns (cn, cva)
- Use formatCurrency for prices
- SSR-friendly (searchParams from server, client interactivity)

### Existing Components to Use

- ProductCard from src/components/ProductCard.tsx
- useCart from src/stores/cart.ts
- formatCurrency from src/lib/format.ts
- UI components from src/components/ui/

## Acceptance Criteria

- [ ] Products page displays filtered/sorted products
- [ ] Category filtering works via URL params
- [ ] Sorting works (price-asc, price-desc, newest)
- [ ] Mobile responsive design
- [ ] Add to cart functionality works
- [ ] Loading states and empty states
- [ ] TypeScript strict mode passed
- [ ] Performance: <1.5s load time

## Deliverable

Return summary of:

- Files created/updated
- How filtering and sorting works
- How to test the page
- Any issues or next steps

Reference Issue #27 in implementation.
