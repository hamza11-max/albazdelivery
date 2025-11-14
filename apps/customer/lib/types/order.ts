import { PaymentMethod, PaymentStatus } from './payment';

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  ASSIGNED = 'ASSIGNED',
  IN_DELIVERY = 'IN_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface OrderItem {
  productId: number
  quantity: number
  price: number
  subtotal: number
  productName: string
}

export interface Order {
  id: string
  customerId: string
  storeId: number
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  deliveryAddress: string
  city: string
  customerPhone: string
  driverId?: string
  createdAt: Date
  updatedAt: Date
  acceptedAt?: Date
  preparingAt?: Date
  readyAt?: Date
  assignedAt?: Date
  deliveredAt?: Date
  scheduledDate?: Date
  scheduledTime?: string
  whoPays?: "customer" | "receiver"
  packageDescription?: string
  recipientName?: string
  recipientPhone?: string
  isPackageDelivery?: boolean
}