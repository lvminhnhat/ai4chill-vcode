import { Shield, Zap, CheckCircle, Headphones } from 'lucide-react'

interface TrustBadge {
  icon: React.ComponentType<{ className?: string }>
  text: string
}

const trustBadges: TrustBadge[] = [
  { icon: Shield, text: '30-Day Money-Back Guarantee' },
  { icon: Zap, text: 'Instant Delivery' },
  { icon: CheckCircle, text: '100% Tested Accounts' },
  { icon: Headphones, text: '24/7 Support' },
]

export function TrustSignals() {
  return (
    <div className="mt-12 border-t pt-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {trustBadges.map((badge, index) => {
          const Icon = badge.icon
          return (
            <div
              key={index}
              className="flex flex-col items-center space-y-2 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {badge.text}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
