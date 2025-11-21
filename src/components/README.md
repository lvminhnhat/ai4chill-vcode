# Homepage Components

This directory contains the homepage components for the AI Tools website.

## Components

### HeroSection

A hero section component with gradient background, text content, and optional image.

#### Props

- `title?` (string): Main headline text. Default: "Tài khoản AI & Premium Tools - Uy tín, Nhanh chóng"
- `subtitle?` (string): Subheadline text. Default: "Cung cấp tài khoản ChatGPT, Claude, Midjourney và các công cụ AI hàng đầu với giá tốt nhất thị trường"
- `primaryCta?` (object): Primary call-to-action button
  - `text` (string): Button text
  - `href` (string): Button link
- `secondaryCta?` (object): Secondary call-to-action button
  - `text` (string): Button text
  - `href` (string): Button link
- `showImage?` (boolean): Whether to show the image section. Default: true
- `className?` (string): Additional CSS classes

#### Features

- Trust Blue gradient background (#2563EB, #1E40AF, #3B82F6)
- Responsive design (desktop: text left + image right, mobile: stacked)
- Min height: 80vh desktop, 60vh mobile
- Hover effects and animations
- Uses existing Button component

#### Example

```tsx
import { HeroSection } from '@/components'

;<HeroSection
  title="Custom Title"
  subtitle="Custom subtitle"
  primaryCta={{ text: 'Get Started', href: '/start' }}
  secondaryCta={{ text: 'Learn More', href: '/about' }}
  showImage={true}
/>
```

### TrustBar

A trust signals component displaying three key benefits with icons.

#### Props

- `className?` (string): Additional CSS classes

#### Features

- Three trust signals: Instant Delivery, 30-Day Guarantee, 24/7 Support
- Icons from lucide-react (Zap, Shield, Headphones)
- Responsive layout (horizontal on desktop, stacked on mobile)
- Hover effects with color transitions
- Trust Blue accent colors

#### Trust Signals

1. **Instant Delivery** - "Nhận tài khoản ngay lập tức"
2. **30-Day Guarantee** - "Bảo hành 30 ngày"
3. **24/7 Support** - "Hỗ trợ 24/7"

#### Example

```tsx
import { TrustBar } from '@/components'

;<TrustBar className="mt-8" />
```

## Design Standards

- **Colors**: Trust Blue palette
  - Primary: #2563EB
  - Secondary: #1E40AF
  - Accent: #3B82F6
- **Typography**: Inter font (already configured)
- **Components**: Uses shadcn/ui patterns
- **Utilities**: Uses `cn()` utility for class merging

## Testing

Both components have comprehensive test coverage:

- HeroSection: 7 tests covering props, rendering, and interactions
- TrustBar: 6 tests covering rendering, structure, and styling

Run tests with:

```bash
npm test -- --testPathPatterns="HeroSection|TrustBar"
```

## Files

- `HeroSection.tsx` - Main HeroSection component
- `TrustBar.tsx` - Main TrustBar component
- `HeroSection.example.tsx` - Usage examples for HeroSection
- `TrustBar.example.tsx` - Usage examples for TrustBar
- `__tests__/HeroSection.test.tsx` - HeroSection tests
- `__tests__/TrustBar.test.tsx` - TrustBar tests
- `index.ts` - Component exports
