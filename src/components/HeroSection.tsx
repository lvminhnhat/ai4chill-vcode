import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface HeroSectionProps {
  title?: string
  subtitle?: string
  primaryCta?: {
    text: string
    href: string
  }
  secondaryCta?: {
    text: string
    href: string
  }
  showImage?: boolean
  className?: string
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title = 'Tài khoản AI & Premium Tools - Uy tín, Nhanh chóng',
  subtitle = 'Cung cấp tài khoản ChatGPT, Claude, Midjourney và các công cụ AI hàng đầu với giá tốt nhất thị trường',
  primaryCta = {
    text: 'Xem sản phẩm ngay',
    href: '#products',
  },
  secondaryCta = {
    text: 'Tìm hiểu thêm',
    href: '/about',
  },
  showImage = true,
  className,
}) => {
  return (
    <section
      className={cn(
        'relative min-h-[80vh] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 lg:min-h-[80vh] md:min-h-[70vh] sm:min-h-[60vh]',
        className
      )}
    >
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left space-y-6 lg:space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="text-xl text-blue-100 sm:text-2xl lg:text-3xl">
                {subtitle}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-3 text-base"
              >
                <Link href={primaryCta.href}>{primaryCta.text}</Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-700 font-semibold px-8 py-3 text-base"
              >
                <Link href={secondaryCta.href}>{secondaryCta.text}</Link>
              </Button>
            </div>
          </div>

          {/* Image */}
          {showImage && (
            <div className="mt-12 lg:mt-0 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl transform rotate-3 opacity-20" />
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="aspect-square w-full max-w-md mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <div className="text-6xl mb-4">🤖</div>
                      <div className="text-2xl font-bold">AI Tools</div>
                      <div className="text-lg opacity-90">Premium Accounts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  )
}

export default HeroSection
