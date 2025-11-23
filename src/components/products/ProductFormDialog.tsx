'use client'

import * as React from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createProduct, updateProduct } from '@/app/actions/product-actions'
import {
  ProductFormSchema,
  ProductFormData,
} from '@/lib/schemas/product-schema'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  description: string | null
  price: number | { toNumber: () => number }
  createdAt: Date
  updatedAt: Date
}

interface ProductFormDialogProps {
  children: React.ReactNode
  product?: Product
}

export function ProductFormDialog({
  children,
  product,
}: ProductFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof ProductFormSchema>>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      price:
        typeof product?.price === 'number'
          ? product.price
          : product?.price?.toNumber() || 0,
    },
  })

  const onSubmit = async (values: z.infer<typeof ProductFormSchema>) => {
    setIsLoading(true)
    try {
      const result = product
        ? await updateProduct(product.id, values as ProductFormData)
        : await createProduct(values as ProductFormData)

      if (result.success) {
        toast.success(
          product
            ? 'Product updated successfully!'
            : 'Product created successfully!'
        )
        setOpen(false)
        form.reset()
      } else {
        toast.error(result.error || 'Failed to save product')
        if (result.details) {
          console.error('Validation errors:', result.details)
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
          <DialogDescription>
            {product
              ? 'Update the product information below.'
              : 'Fill in the information below to create a new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter product description (optional)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description of the product.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                      onChange={e =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Base price for the product. Variants can have different
                    prices.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {product ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{product ? 'Update Product' : 'Create Product'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
