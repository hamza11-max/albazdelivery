import { z } from 'zod'

// ========================================
// Order Validation Schemas
// ========================================

export const createOrderSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product ID is required'),
      quantity: z.number().int().positive('Quantity must be positive'),
      price: z.number().positive('Price must be positive'),
    })
  ).min(1, 'At least one item is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
  deliveryFee: z.number().nonnegative('Delivery fee cannot be negative'),
  total: z.number().positive('Total must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'WALLET']),
  deliveryAddress: z.string().min(10, 'Delivery address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  customerPhone: z.string().regex(/^0[567]\d{8}$/, 'Invalid Algerian phone number'),
  // Package delivery specific fields
  isPackageDelivery: z.boolean().optional().default(false),
  packageDescription: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().regex(/^0[567]\d{8}$/).optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  whoPays: z.enum(['customer', 'receiver']).optional().default('customer'),
}).refine(
  (data) => {
    // Validate that total equals subtotal + deliveryFee
    const calculatedTotal = data.subtotal + data.deliveryFee
    return Math.abs(data.total - calculatedTotal) < 0.01
  },
  {
    message: 'Total must equal subtotal + delivery fee',
    path: ['total'],
  }
)

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'ASSIGNED',
    'IN_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]),
})

// ========================================
// Product Validation Schemas
// ========================================

export const createProductSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  image: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  available: z.boolean().optional().default(true),
})

export const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  image: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  available: z.boolean().optional(),
})

// ========================================
// Review Validation Schemas
// ========================================

export const createReviewSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  foodQuality: z.number().int().min(1).max(5).optional(),
  deliveryTime: z.number().int().min(1).max(5).optional(),
  customerService: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000),
  photos: z.array(z.string().url()).optional().default([]),
})

export const vendorResponseSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters').max(500),
})

// ========================================
// Chat Validation Schemas
// ========================================

export const sendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  attachments: z.array(z.string().url()).optional().default([]),
})

export const createConversationSchema = z.object({
  participantIds: z.array(z.string().cuid('Invalid participant ID')).min(2, 'At least 2 participants are required'),
  type: z.enum(['CUSTOMER_VENDOR', 'CUSTOMER_DRIVER', 'CUSTOMER_ADMIN', 'VENDOR_ADMIN']),
  relatedOrderId: z.string().cuid('Invalid order ID').optional(),
})

// ========================================
// Support Ticket Validation Schemas
// ========================================

export const createSupportTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.enum(['ORDER', 'DELIVERY', 'PAYMENT', 'ACCOUNT', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
})

export const updateSupportTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assignedTo: z.string().optional(),
})

// ========================================
// Wallet Validation Schemas
// ========================================

export const walletTransactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(5, 'Description is required').max(200),
  type: z.enum(['CREDIT', 'DEBIT']).optional(), // Type is determined by amount sign
})

// ========================================
// Loyalty Validation Schemas
// ========================================

export const redeemRewardSchema = z.object({
  rewardId: z.string().min(1, 'Reward ID is required'),
})

// ========================================
// Driver Location Validation Schemas
// ========================================

export const updateDriverLocationSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  accuracy: z.number().nonnegative().optional(),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  status: z.enum(['offline', 'online', 'delivering']).optional(),
  currentOrderId: z.string().optional(),
})

// ========================================
// Package Delivery Validation Schemas
// ========================================

export const createPackageDeliverySchema = z.object({
  recipientName: z.string().min(2, 'Recipient name is required'),
  recipientPhone: z.string().regex(/^0[567]\d{8}$/, 'Invalid Algerian phone number'),
  deliveryAddress: z.string().min(10, 'Delivery address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  packageDescription: z.string().min(10, 'Package description is required').max(500),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  whoPays: z.enum(['customer', 'receiver']).default('customer'),
  deliveryFee: z.number().nonnegative('Delivery fee cannot be negative'),
})

// ========================================
// Refund Validation Schemas
// ========================================

export const createRefundSchema = z.object({
  orderId: z.string().cuid('Invalid order ID'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  amount: z.number().positive('Amount must be positive').optional(),
})

// ========================================
// ERP Inventory Validation Schemas
// ========================================

export const createInventoryProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(2, 'Name is required'),
  category: z.string().min(1, 'Category is required'),
  costPrice: z.number().positive('Cost price must be positive'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
  lowStockThreshold: z.number().int().nonnegative('Low stock threshold cannot be negative'),
  barcode: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  supplierId: z.string().optional(),
})

export const updateInventoryProductSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  costPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  barcode: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  supplierId: z.string().optional(),
})

// ========================================
// Query Parameter Validation Schemas
// ========================================

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
})

export const orderQuerySchema = z.object({
  status: z.enum([
    'PENDING',
    'ACCEPTED',
    'PREPARING',
    'READY',
    'ASSIGNED',
    'IN_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ]).optional(),
  customerId: z.string().optional(),
  vendorId: z.string().optional(),
  driverId: z.string().optional(),
  storeId: z.string().optional(),
  city: z.string().optional(),
})

// Type exports
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type VendorResponseInput = z.infer<typeof vendorResponseSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>
export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>
export type WalletTransactionInput = z.infer<typeof walletTransactionSchema>
export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>
export type UpdateDriverLocationInput = z.infer<typeof updateDriverLocationSchema>
export type CreatePackageDeliveryInput = z.infer<typeof createPackageDeliverySchema>
export type CreateRefundInput = z.infer<typeof createRefundSchema>
export type CreateInventoryProductInput = z.infer<typeof createInventoryProductSchema>
export type UpdateInventoryProductInput = z.infer<typeof updateInventoryProductSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type OrderQueryInput = z.infer<typeof orderQuerySchema>

// ========================================
// Payment Validation Schemas
// ========================================

export const createPaymentSchema = z.object({
  orderId: z.string().cuid('Invalid order ID'),
  amount: z.number().positive('Amount must be positive'),
  method: z.enum(['CASH', 'CARD', 'WALLET'], {
    errorMap: () => ({ message: 'Payment method must be CASH, CARD, or WALLET' }),
  }),
  transactionId: z.string().optional(),
})

// ========================================
// Notification Validation Schemas
// ========================================

export const markNotificationReadSchema = z.object({
  notificationId: z.string().cuid('Invalid notification ID').optional(),
  markAllAsRead: z.boolean().optional(),
}).refine(
  (data) => data.notificationId || data.markAllAsRead,
  {
    message: 'Either notificationId or markAllAsRead must be provided',
    path: ['notificationId'],
  }
)

// ========================================
// Chat Message Validation Schemas
// ========================================

export const getMessagesSchema = z.object({
  conversationId: z.string().cuid('Invalid conversation ID'),
  limit: z.number().int().min(1).max(100).optional().default(50),
  page: z.number().int().min(1).optional().default(1),
})

// ========================================
// Order Status Update Validation Schemas
// ========================================
// Note: orderId is optional here because it can come from route params
// The route handler should validate the orderId from params separately
export const updateOrderStatusBodySchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'IN_DELIVERY', 'DELIVERED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
  driverId: z.string().cuid('Invalid driver ID').optional(),
})

// ========================================
// Analytics Validation Schemas
// ========================================

export const analyticsDashboardSchema = z.object({
  vendorId: z.string().cuid('Invalid vendor ID').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// ========================================
// Payment History Validation Schemas
// ========================================

export const paymentHistorySchema = z.object({
  customerId: z.string().cuid('Invalid customer ID').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(50),
})

