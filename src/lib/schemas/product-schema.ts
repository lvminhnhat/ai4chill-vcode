import { z } from 'zod'

export const ProductFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be a positive number'),
})

export const VariantFormSchema = z.object({
  name: z.string().min(1, 'Variant name is required').max(100, 'Name too long'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  duration: z
    .string()
    .min(1, 'Duration is required')
    .max(50, 'Duration too long'),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
})

export type ProductFormData = z.infer<typeof ProductFormSchema>
export type VariantFormData = z.infer<typeof VariantFormSchema>
