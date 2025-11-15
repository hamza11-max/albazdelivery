// Re-export types from individual type files to avoid duplicates
// These are the source of truth for their respective types
export * from '../../../../lib/types/api'
export * from '../../../../lib/types/order'
export * from '../../../../lib/types/product'
export * from '../../../../lib/types/customer'
export * from '../../../../lib/types/supplier'
export * from '../../../../lib/types/sale'
export * from '../../../../lib/types/category'
export * from '../../../../lib/types/payment'
export * from '../../../../lib/types/cart'

// Export unique types that are only in lib/types.ts (not in individual files)
// These types don't have dedicated files
export type {
  UserRole,
  ApprovalStatus,
  MembershipTier,
  ChatParticipantRole,
  TicketStatus,
  TicketPriority
} from '../../../../lib/types'

export type {
  User,
  RegistrationRequest,
  Store,
  Delivery,
  SalesForecast,
  InventoryRecommendation,
  ProductBundle,
  Wallet,
  WalletTransaction,
  Refund,
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyReward,
  CustomerRedemption,
  VendorReview,
  VendorPerformance,
  VendorResponse,
  ChatMessage,
  Conversation,
  SupportTicket,
  ChatBot,
  DeliveryRoute,
  DeliveryZone,
  DeliveryPrediction,
  DriverPerformance,
  Notification,
  DriverLocation,
  LocationHistory,
  ScheduledDelivery
} from '../../../../lib/types'
