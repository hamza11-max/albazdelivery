import { z } from 'zod'

const algerianPhoneRegex = /^0[567]\d{8}$/

export const orderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive'),
})

export const createOrderSchema = z.object({
  storeId: z.string().cuid('Invalid store ID'),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  subtotal: z.number().positive('Subtotal must be positive'),
  deliveryFee: z.number().nonnegative('Delivery fee cannot be negative'),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'WALLET']),
  deliveryAddress: z.string().min(10, 'Delivery address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  customerPhone: z.string().regex(algerianPhoneRegex, 'Invalid phone number'),
})

export const createPackageDeliverySchema = z.object({
  packageDescription: z.string().min(5, 'Package description must be at least 5 characters'),
  recipientName: z.string().min(2, 'Recipient name is required'),
  recipientPhone: z.string().regex(algerianPhoneRegex, 'Invalid recipient phone number'),
  deliveryAddress: z.string().min(10, 'Delivery address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  customerPhone: z.string().regex(algerianPhoneRegex, 'Invalid phone number'),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  whoPays: z.enum(['customer', 'receiver']).default('customer'),
  deliveryFee: z.number().positive('Delivery fee must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'WALLET']),
})

export const updateOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: z.enum([
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'ASSIGNED',
    'IN_DELIVERY',
    'DELIVERED',
    'CANCELLED'
  ]),
  driverId: z.string().cuid().optional(),
})

export const assignDriverSchema = z.object({
  orderId: z.string().cuid(),
  driverId: z.string().cuid(),
})

export const cancelOrderSchema = z.object({
  orderId: z.string().cuid(),
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters'),
})

export const rateOrderSchema = z.object({
  orderId: z.string().cuid(),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  foodQuality: z.number().int().min(1).max(5).optional(),
  deliveryTime: z.number().int().min(1).max(5).optional(),
  customerService: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
  photos: z.array(z.string().url()).max(5, 'Maximum 5 photos allowed').optional(),
})

export type OrderItem = z.infer<typeof orderItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type CreatePackageDeliveryInput = z.infer<typeof createPackageDeliverySchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type AssignDriverInput = z.infer<typeof assignDriverSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
export type RateOrderInput = z.infer<typeof rateOrderSchema>
