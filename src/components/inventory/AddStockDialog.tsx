'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { addAccounts } from '@/app/actions/inventory-actions'
import { useRouter } from 'next/navigation'

interface AddStockDialogProps {
  variantId: string
  variantName: string
  productName: string
}

export function AddStockDialog({
  variantId,
  variantName,
  productName,
}: AddStockDialogProps) {
  const [open, setOpen] = useState(false)
  const [accountsText, setAccountsText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    added?: number
    duplicates?: number
  } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      const response = await addAccounts(variantId, accountsText)
      setResult(response)

      if (response.success) {
        setAccountsText('')
        setTimeout(() => {
          setOpen(false)
          setResult(null)
        }, 2000)
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'An unexpected error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Stock - {productName}</DialogTitle>
          <DialogDescription>
            Add account credentials for variant: <strong>{variantName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="accounts">Account Credentials</Label>
              <Textarea
                id="accounts"
                placeholder="Enter credentials in format:&#10;email1@domain.com:password1&#10;email2@domain.com:password2&#10;email3@domain.com:password3"
                value={accountsText}
                onChange={e => setAccountsText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Format: email:password (one per line)
              </p>
            </div>

            {result && (
              <div
                className={`p-3 rounded-md flex items-start gap-2 ${
                  result.success
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm">
                  {result.message}
                  {result.success && result.added !== undefined && (
                    <div className="mt-1">
                      Added: {result.added} accounts
                      {result.duplicates && result.duplicates > 0 && (
                        <span className="text-yellow-700">
                          {' '}
                          • {result.duplicates} duplicates skipped
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
                setResult(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
