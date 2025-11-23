'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ProductFiltersProps {
  className?: string
}

const CATEGORIES = [
  { id: 'AI Chat', label: 'AI Chat' },
  { id: 'AI Art', label: 'AI Art' },
  { id: 'AI Coding', label: 'AI Coding' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
]

export function ProductFilters({ className }: ProductFiltersProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false)

  const currentCategory = searchParams.get('category')?.split('+') || []
  const currentSort = searchParams.get('sort') || 'newest'

  const updateURL = (params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value)
      }
    })

    const newUrl = `/products${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`
    router.push(newUrl, { scroll: false })
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...currentCategory, categoryId]
      : currentCategory.filter(cat => cat !== categoryId)

    updateURL({
      category: newCategories.length > 0 ? newCategories.join('+') : null,
    })
  }

  const handleSortChange = (value: string) => {
    updateURL({ sort: value })
  }

  const clearFilters = () => {
    updateURL({
      category: null,
      sort: 'newest',
    })
    setIsMobileFilterOpen(false)
  }

  const hasActiveFilters =
    currentCategory.length > 0 || currentSort !== 'newest'

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="mb-4 text-sm font-semibold">Categories</h3>
        <div className="space-y-3">
          {CATEGORIES.map(category => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={currentCategory.includes(category.id)}
                onCheckedChange={(checked: boolean) =>
                  handleCategoryChange(category.id, checked)
                }
              />
              <Label
                htmlFor={category.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h3 className="mb-4 text-sm font-semibold">Sort By</h3>
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select sort option" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )

  return (
    <div className={cn('', className)}>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {currentCategory.length + (currentSort !== 'newest' ? 1 : 0)}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FiltersContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <FiltersContent />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
