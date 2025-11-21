import React from 'react'
import { Zap, Shield, Headphones } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TrustBarProps {
  className?: string
}

const TrustBar: React.FC<TrustBarProps> = ({ className }) => {
  const trustSignals = [
    {
      icon: Zap,
      title: 'Instant Delivery',
      description: 'Nhận tài khoản ngay lập tức',
    },
    {
      icon: Shield,
      title: '30-Day Guarantee',
      description: 'Bảo hành 30 ngày',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Hỗ trợ 24/7',
    },
  ]

  return (
    <div
      className={cn(
        'bg-white border-b border-gray-200 py-6 sm:py-8',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 lg:gap-8">
          {trustSignals.map((signal, index) => {
            const IconComponent = signal.icon

            return (
              <div
                key={index}
                className="flex flex-col items-center text-center space-y-3 group"
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 group-hover:scale-110',
                    'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                  )}
                >
                  <IconComponent className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                    {signal.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    {signal.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TrustBar
