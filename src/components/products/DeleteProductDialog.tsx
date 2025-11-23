'use client'

import * as React from 'react'
import { useState } from 'react'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'

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
import { deleteProduct } from '@/app/actions/product-actions'
import { toast } from 'sonner'

interface DeleteProductDialogProps {
  children: React.ReactNode
  productId: string
  productName: string
  variantCount: number
}

export function DeleteProductDialog({
  children,
  productId,
  productName,
  variantCount,
}: DeleteProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const result = await deleteProduct(productId)

      if (result.success) {
        toast.success('Product deleted successfully!')
        setOpen(false)
      } else {
        toast.error(result.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Product
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{productName}"? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {variantCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Warning</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                This product has {variantCount} variant(s). You must delete all
                variants first before deleting the product.
              </p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <p>Product ID: {productId}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || variantCount > 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
