'use client'

import { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Loader2 } from 'lucide-react'
import { createVariant, updateVariant } from '@/app/actions/product-actions'
import {
  VariantFormSchema,
  VariantFormData,
} from '@/lib/schemas/product-schema'
import { toast } from 'sonner'

interface Variant {
  id: string
  name: string
  price: number
  duration: string
  stock: number
}

interface VariantFormDialogProps {
  productId: string
  variant?: Variant
  children: React.ReactNode
}

export function VariantFormDialog({
  productId,
  variant,
  children,
}: VariantFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<VariantFormData>({
    resolver: zodResolver(VariantFormSchema),
    defaultValues: {
      name: variant?.name || '',
      price: variant?.price ? Number(variant.price) : 0,
      duration: variant?.duration || '',
      stock: variant?.stock || 0,
    },
    mode: 'onBlur',
  })

  const onSubmit: SubmitHandler<VariantFormData> = async data => {
    setIsSubmitting(true)

    try {
      const result = variant
        ? await updateVariant(variant.id, data)
        : await createVariant(productId, data)

      if (result.success) {
        toast.success(
          variant
            ? 'Variant updated successfully'
            : 'Variant created successfully'
        )
        setOpen(false)
        form.reset()
      } else {
        toast.error(result.error || 'Failed to save variant')
        if (result.details) {
          console.error('Validation errors:', result.details)
        }
      }
    } catch (error) {
      console.error('Error saving variant:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {variant ? 'Edit Variant' : 'Add New Variant'}
          </DialogTitle>
          <DialogDescription>
            {variant
              ? 'Update the variant information below.'
              : 'Create a new variant for this product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 1 Month Subscription"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="29.99"
                      {...field}
                      onChange={e =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 1 month, 3 months, 1 year"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={e =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {variant ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {variant ? (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Update Variant
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Variant
                      </>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
