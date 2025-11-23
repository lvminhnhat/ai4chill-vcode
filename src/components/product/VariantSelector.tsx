'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/format'
import { useMemo } from 'react'
import type { Variant } from '@/types/product'

interface VariantSelectorProps {
  variants: Variant[]
  selectedVariantId?: string
  onVariantChange: (variantId: string) => void
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onVariantChange,
}: VariantSelectorProps) {
  const selectedVariant = useMemo(
    () => variants.find(v => v.id === selectedVariantId),
    [variants, selectedVariantId]
  )

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', className: 'text-red-600' }
    if (stock <= 5)
      return { text: `Only ${stock} left!`, className: 'text-orange-600' }
    return { text: 'In Stock', className: 'text-green-600' }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Plan</h3>
      <p id="variant-description" className="text-sm text-gray-600">
        Chọn gói dịch vụ phù hợp với nhu cầu của bạn. Sử dụng phím mũi tên để di
        chuyển và phím cách để chọn.
      </p>
      <div className="text-xs text-gray-500 mt-1">
        💡 Mẹo: Dùng Tab để di chuyển đến lựa chọn, mũi tên lên/xuống để chọn,
        Enter hoặc Space để xác nhận
      </div>
      <RadioGroup
        value={selectedVariantId}
        onValueChange={onVariantChange}
        className="space-y-3"
        aria-label="Chọn gói dịch vụ"
        aria-describedby="variant-description"
      >
        {variants.map(variant => {
          const stockStatus = getStockStatus(variant.stock)
          const isDisabled = variant.stock === 0

          return (
            <div key={variant.id} className="flex items-center space-x-3">
              <RadioGroupItem
                value={variant.id}
                id={variant.id}
                disabled={isDisabled}
                className="flex-shrink-0"
                aria-describedby={`variant-${variant.id}-info`}
              />
              <Label
                htmlFor={variant.id}
                className={`flex flex-1 items-center justify-between cursor-pointer ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{variant.name}</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(variant.price)}
                  </span>
                </div>
                <span
                  id={`variant-${variant.id}-info`}
                  className={`text-sm ${stockStatus.className}`}
                >
                  {stockStatus.text}
                </span>
              </Label>
            </div>
          )
        })}
      </RadioGroup>

      {selectedVariant && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Selected:</span>
            <div className="text-right">
              <div className="font-medium">{selectedVariant.name}</div>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(selectedVariant.price)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
