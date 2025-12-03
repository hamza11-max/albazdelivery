export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  WALLET = 'WALLET',
  GOOGLE_PAY = 'GOOGLE_PAY'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface Payment {
  id: string
  orderId: string
  customerId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  transactionId?: string
  createdAt: Date
  completedAt?: Date
}