import { z } from 'zod'

const algerianPhone = /^0[567]\d{8}$/

/**
 * Expected shape in Flow completion `nfm_reply.response_json` (and optional extension params).
 */
export const whatsAppFlowOrderResponseSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.coerce.number().int().positive(),
        }),
      )
      .min(1),
    deliveryAddress: z.string().min(10).optional(),
    city: z.string().min(2),
    customerPhone: z.string().regex(algerianPhone).optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'WALLET']).optional().default('CASH'),
    deliveryFee: z.coerce.number().nonnegative().optional(),
    /** Allow snake_case from Flow form field names */
    delivery_fee: z.coerce.number().nonnegative().optional(),
    delivery_address: z.string().min(10).optional(),
  })
  .refine((raw) => Boolean(raw.delivery_address?.length || raw.deliveryAddress?.length), {
    message: 'delivery address required',
  })
  .transform((raw) => ({
    items: raw.items,
    deliveryAddress: (raw.delivery_address ?? raw.deliveryAddress) as string,
    city: raw.city,
    customerPhone: raw.customerPhone,
    paymentMethod: (raw.paymentMethod ?? 'CASH').toUpperCase() as 'CASH' | 'CARD' | 'WALLET',
    deliveryFee: raw.delivery_fee ?? raw.deliveryFee ?? 0,
  }))

export type WhatsAppFlowOrderPayload = z.infer<typeof whatsAppFlowOrderResponseSchema>
