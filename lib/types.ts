export type UserRole = "customer" | "vendor" | "driver" | "admin"

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "assigned"
  | "in_delivery"
  | "delivered"
  | "cancelled"

export type ApprovalStatus = "pending" | "approved" | "rejected"

export type PaymentMethod = "cash" | "card" | "wallet"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export type MembershipTier = "bronze" | "silver" | "gold" | "platinum"

export type ChatParticipantRole = "customer" | "vendor" | "driver" | "admin"
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed"
export type TicketPriority = "low" | "medium" | "high" | "urgent"

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  createdAt: Date
  approvalStatus?: ApprovalStatus
  licenseNumber?: string
  shopType?: string
}

export interface RegistrationRequest {
  id: string
  role: UserRole
  name: string
  email: string
  phone: string
  password: string
  licenseNumber?: string
  shopType?: string
  status: ApprovalStatus
  createdAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export interface Store {
  id: number
  name: string
  type: string
  rating: number
  deliveryTime: string
  categoryId: number
  vendorId: string
  address: string
  city: string
}

export interface Product {
  id: number
  storeId: number
  name: string
  description: string
  price: number
  image: string
  rating: number
  available: boolean
}

export interface OrderItem {
  productId: number
  quantity: number
  price: number
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

export interface Delivery {
  id: string
  orderId: string
  driverId: string
  status: "assigned" | "picked_up" | "in_transit" | "delivered"
  pickupAddress: string
  deliveryAddress: string
  customerPhone: string
  assignedAt: Date
  pickedUpAt?: Date
  deliveredAt?: Date
}

export interface InventoryProduct {
  id: number
  sku: string
  name: string
  category: string
  supplierId?: number
  costPrice: number
  sellingPrice: number
  stock: number
  lowStockThreshold: number
  image?: string
  barcode?: string
  createdAt: Date
  updatedAt: Date
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone: string
  totalPurchases: number
  lastPurchaseDate?: Date
  createdAt: Date
}

export interface Supplier {
  id: number
  name: string
  contactPerson: string
  phone: string
  email?: string
  address?: string
  productsSupplied: string[]
  createdAt: Date
}

export interface Sale {
  id: string
  customerId?: string
  items: SaleItem[]
  subtotal: number
  discount: number
  total: number
  paymentMethod: "cash" | "card"
  createdAt: Date
}

export interface SaleItem {
  productId: number
  productName: string
  quantity: number
  price: number
  discount: number
}

export interface SalesForecast {
  period: "week" | "month"
  predictedSales: number
  confidence: number
  trend: "up" | "down" | "stable"
}

export interface InventoryRecommendation {
  productId: number
  productName: string
  currentStock: number
  recommendedQuantity: number
  reason: string
}

export interface ProductBundle {
  products: number[]
  frequency: number
  suggestedDiscount: number
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

export interface Wallet {
  id: string
  customerId: string
  balance: number
  totalSpent: number
  totalEarned: number
  createdAt: Date
  updatedAt: Date
}

export interface WalletTransaction {
  id: string
  walletId: string
  type: "credit" | "debit"
  amount: number
  description: string
  relatedOrderId?: string
  createdAt: Date
}

export interface Refund {
  id: string
  paymentId: string
  orderId: string
  amount: number
  reason: string
  status: "pending" | "approved" | "rejected" | "completed"
  createdAt: Date
  processedAt?: Date
}

export interface LoyaltyAccount {
  id: string
  customerId: string
  points: number
  totalPointsEarned: number
  totalPointsRedeemed: number
  tier: MembershipTier
  tierExpiresAt?: Date
  referralCode: string
  referralCount: number
  createdAt: Date
  updatedAt: Date
}

export interface LoyaltyTransaction {
  id: string
  loyaltyAccountId: string
  type: "earn" | "redeem"
  points: number
  description: string
  relatedOrderId?: string
  createdAt: Date
}

export interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsCost: number
  discount: number
  expiresAt: Date
  category: "discount" | "free_item" | "bonus_points"
  createdAt: Date
}

export interface CustomerRedemption {
  id: string
  customerId: string
  rewardId: string
  status: "active" | "used" | "expired"
  redeemedAt?: Date
  usedAt?: Date
  expiresAt: Date
  createdAt: Date
}

export interface VendorReview {
  id: string
  vendorId: string
  customerId: string
  orderId: string
  rating: number // 1-5
  foodQuality: number // 1-5
  deliveryTime: number // 1-5
  customerService: number // 1-5
  comment: string
  photos?: string[]
  helpful: number
  unhelpful: number
  createdAt: Date
  updatedAt: Date
}

export interface VendorPerformance {
  vendorId: string
  totalReviews: number
  averageRating: number
  foodQualityRating: number
  deliveryTimeRating: number
  customerServiceRating: number
  responseRate: number
  responseTime: number // in hours
  badges: string[] // "top_rated", "fast_delivery", "excellent_service"
  tier: "bronze" | "silver" | "gold" | "platinum"
  createdAt: Date
  updatedAt: Date
}

export interface VendorResponse {
  id: string
  reviewId: string
  vendorId: string
  response: string
  createdAt: Date
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderRole: ChatParticipantRole
  senderName: string
  message: string
  attachments?: string[]
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Conversation {
  id: string
  participantIds: string[]
  participantRoles: ChatParticipantRole[]
  type: "customer_vendor" | "customer_driver" | "customer_admin" | "vendor_admin"
  relatedOrderId?: string
  lastMessage?: string
  lastMessageTime?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SupportTicket {
  id: string
  customerId: string
  subject: string
  description: string
  category: "order" | "delivery" | "payment" | "account" | "other"
  priority: TicketPriority
  status: TicketStatus
  assignedTo?: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
}

export interface ChatBot {
  id: string
  name: string
  role: "faq" | "order_tracking" | "general_support"
  responses: Map<string, string>
}

export interface DeliveryRoute {
  id: string
  driverId: string
  deliveries: string[] // order IDs
  optimizedSequence: string[]
  totalDistance: number
  estimatedTime: number // in minutes
  status: "planned" | "in_progress" | "completed"
  createdAt: Date
  completedAt?: Date
}

export interface DeliveryZone {
  id: string
  name: string
  city: string
  coordinates: { lat: number; lng: number }[]
  deliveryFee: number
  estimatedTime: number // in minutes
  activeDrivers: number
  createdAt: Date
}

export interface DeliveryPrediction {
  orderId: string
  estimatedPickupTime: number // in minutes
  estimatedDeliveryTime: number // in minutes
  confidence: number // 0-1
  factors: string[]
}

export interface DriverPerformance {
  driverId: string
  totalDeliveries: number
  averageDeliveryTime: number
  onTimePercentage: number
  rating: number
  earnings: number
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  recipientId: string
  recipientRole: UserRole
  type: "order_status" | "delivery_update" | "payment_confirmation" | "loyalty_reward" | "promotion"
  title: string
  message: string
  relatedOrderId?: string
  relatedDeliveryId?: string
  actionUrl?: string
  isRead: boolean
  createdAt: Date
  readAt?: Date
}

export interface DriverLocation {
  driverId: string
  latitude: number
  longitude: number
  accuracy: number
  heading: number
  speed: number
  updatedAt: Date
}

export interface ScheduledDelivery {
  id: string
  orderId: string
  scheduledDate: Date
  scheduledTime: string
  status: "scheduled" | "confirmed" | "cancelled"
  createdAt: Date
}
