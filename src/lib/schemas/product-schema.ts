import { z } from 'zod'

export const ProductFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be a positive number'),
})

export type ProductFormData = z.infer<typeof ProductFormSchema>
