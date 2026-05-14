import { z } from 'zod'

export const createReservationSchema = z.object({
  productId: z.string().cuid(),
  warehouseId: z.string().cuid(),
  quantity: z.number().int().positive().max(10),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>
