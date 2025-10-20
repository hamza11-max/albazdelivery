import type {
  Order,
  User,
  Store,
  Product,
  Delivery,
  OrderStatus,
  RegistrationRequest,
  InventoryProduct,
  Customer,
  Supplier,
  Sale,
  Payment,
  PaymentStatus,
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
  Conversation,
  ChatMessage,
  SupportTicket,
  TicketStatus,
  ChatParticipantRole,
  DeliveryRoute,
  DeliveryZone,
  DriverPerformance,
  Notification,
  DriverLocation,
  PaymentMethod,
} from "./types"

// In-memory database (replace with real database in production)
class Database {
  private orders: Map<string, Order> = new Map()
  private users: Map<string, User> = new Map()
  private stores: Map<number, Store> = new Map()
  private products: Map<number, Product> = new Map()
  private deliveries: Map<string, Delivery> = new Map()
  private registrationRequests: Map<string, RegistrationRequest> = new Map()
  private inventoryProducts: Map<number, InventoryProduct> = new Map()
  private customers: Map<string, Customer> = new Map()
  private suppliers: Map<number, Supplier> = new Map()
  private sales: Map<string, Sale> = new Map()
  private payments: Map<string, Payment> = new Map()
  private wallets: Map<string, Wallet> = new Map()
  private walletTransactions: Map<string, WalletTransaction> = new Map()
  private refunds: Map<string, Refund> = new Map()
  private loyaltyAccounts: Map<string, LoyaltyAccount> = new Map()
  private loyaltyTransactions: Map<string, LoyaltyTransaction> = new Map()
  private loyaltyRewards: Map<string, LoyaltyReward> = new Map()
  private customerRedemptions: Map<string, CustomerRedemption> = new Map()
  private vendorReviews: Map<string, VendorReview> = new Map()
  private vendorPerformance: Map<string, VendorPerformance> = new Map()
  private vendorResponses: Map<string, VendorResponse> = new Map()
  private conversations: Map<string, Conversation> = new Map()
  private chatMessages: Map<string, ChatMessage> = new Map()
  private supportTickets: Map<string, SupportTicket> = new Map()
  private deliveryRoutes: Map<string, DeliveryRoute> = new Map()
  private deliveryZones: Map<string, DeliveryZone> = new Map()
  private driverPerformance: Map<string, DriverPerformance> = new Map()
  private notifications: Map<string, Notification> = new Map()
  private driverLocations: Map<string, DriverLocation> = new Map()

  // Orders
  createOrder(order: Order): Order {
    this.orders.set(order.id, order)
    return order
  }

  getOrder(id: string): Order | undefined {
    return this.orders.get(id)
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values())
  }

  getOrdersByCustomer(customerId: string): Order[] {
    return Array.from(this.orders.values()).filter((order) => order.customerId === customerId)
  }

  getOrdersByStore(storeId: number): Order[] {
    return Array.from(this.orders.values()).filter((order) => order.storeId === storeId)
  }

  getOrdersByDriver(driverId: string): Order[] {
    return Array.from(this.orders.values()).filter((order) => order.driverId === driverId)
  }

  getPendingOrders(): Order[] {
    return Array.from(this.orders.values()).filter((order) => order.status === "pending")
  }

  getAvailableDeliveries(): Order[] {
    return Array.from(this.orders.values()).filter((order) => order.status === "ready" && !order.driverId)
  }

  updateOrderStatus(id: string, status: OrderStatus, driverId?: string): Order | undefined {
    const order = this.orders.get(id)
    if (!order) return undefined

    order.status = status
    order.updatedAt = new Date()

    if (status === "accepted") order.acceptedAt = new Date()
    if (status === "preparing") order.preparingAt = new Date()
    if (status === "ready") order.readyAt = new Date()
    if (status === "assigned") {
      order.assignedAt = new Date()
      if (driverId) order.driverId = driverId
    }
    if (status === "delivered") order.deliveredAt = new Date()

    this.orders.set(id, order)
    return order
  }

  getScheduledOrders(date: Date): Order[] {
    return Array.from(this.orders.values()).filter((order) => {
      if (!order.scheduledDate) return false
      const orderDate = new Date(order.scheduledDate)
      return orderDate.toDateString() === date.toDateString()
    })
  }

  getOrdersByPaymentMethod(method: PaymentMethod): Order[] {
    return Array.from(this.orders.values()).filter((order) => order.paymentMethod === method)
  }

  assignDriver(orderId: string, driverId: string): Order | undefined {
    const order = this.orders.get(orderId)
    if (!order) return undefined

    order.driverId = driverId
    order.status = "assigned"
    order.assignedAt = new Date()
    order.updatedAt = new Date()

    this.orders.set(orderId, order)
    return order
  }

  // Users
  createUser(user: User): User {
    this.users.set(user.id, user)
    return user
  }

  getUser(id: string): User | undefined {
    return this.users.get(id)
  }

  getUsersByRole(role: string): User[] {
    return Array.from(this.users.values()).filter((user) => user.role === role)
  }

  // Stores
  createStore(store: Store): Store {
    this.stores.set(store.id, store)
    return store
  }

  getStore(id: number): Store | undefined {
    return this.stores.get(id)
  }

  getStoresByVendor(vendorId: string): Store[] {
    return Array.from(this.stores.values()).filter((store) => store.vendorId === vendorId)
  }

  // Products
  createProduct(product: Product): Product {
    this.products.set(product.id, product)
    return product
  }

  getProduct(id: number): Product | undefined {
    return this.products.get(id)
  }

  getProductsByStore(storeId: number): Product[] {
    return Array.from(this.products.values()).filter((product) => product.storeId === storeId)
  }

  updateProductAvailability(id: number, available: boolean): Product | undefined {
    const product = this.products.get(id)
    if (!product) return undefined

    product.available = available
    this.products.set(id, product)
    return product
  }

  // Deliveries
  createDelivery(delivery: Delivery): Delivery {
    this.deliveries.set(delivery.id, delivery)
    return delivery
  }

  getDelivery(id: string): Delivery | undefined {
    return this.deliveries.get(id)
  }

  getDeliveriesByDriver(driverId: string): Delivery[] {
    return Array.from(this.deliveries.values()).filter((delivery) => delivery.driverId === driverId)
  }

  updateDeliveryStatus(
    id: string,
    status: "assigned" | "picked_up" | "in_transit" | "delivered",
  ): Delivery | undefined {
    const delivery = this.deliveries.get(id)
    if (!delivery) return undefined

    delivery.status = status
    if (status === "picked_up") delivery.pickedUpAt = new Date()
    if (status === "delivered") delivery.deliveredAt = new Date()

    this.deliveries.set(id, delivery)
    return delivery
  }

  createRegistrationRequest(request: RegistrationRequest): RegistrationRequest {
    this.registrationRequests.set(request.id, request)
    return request
  }

  getRegistrationRequest(id: string): RegistrationRequest | undefined {
    return this.registrationRequests.get(id)
  }

  getAllRegistrationRequests(): RegistrationRequest[] {
    return Array.from(this.registrationRequests.values())
  }

  getPendingRegistrationRequests(): RegistrationRequest[] {
    return Array.from(this.registrationRequests.values()).filter((req) => req.status === "pending")
  }

  approveRegistrationRequest(id: string, adminId: string): User | undefined {
    const request = this.registrationRequests.get(id)
    if (!request || request.status !== "pending") return undefined

    // Update request status
    request.status = "approved"
    request.reviewedAt = new Date()
    request.reviewedBy = adminId
    this.registrationRequests.set(id, request)

    // Create user account
    const user: User = {
      id: `${request.role}-${Date.now()}`,
      name: request.name,
      email: request.email,
      phone: request.phone,
      role: request.role,
      createdAt: new Date(),
      approvalStatus: "approved",
      licenseNumber: request.licenseNumber,
      shopType: request.shopType,
    }

    this.createUser(user)
    return user
  }

  rejectRegistrationRequest(id: string, adminId: string): boolean {
    const request = this.registrationRequests.get(id)
    if (!request || request.status !== "pending") return false

    request.status = "rejected"
    request.reviewedAt = new Date()
    request.reviewedBy = adminId
    this.registrationRequests.set(id, request)

    // Optionally delete the request after rejection
    // this.registrationRequests.delete(id)

    return true
  }

  // Inventory Products
  createInventoryProduct(product: InventoryProduct): InventoryProduct {
    this.inventoryProducts.set(product.id, product)
    return product
  }

  getInventoryProduct(id: number): InventoryProduct | undefined {
    return this.inventoryProducts.get(id)
  }

  getAllInventoryProducts(): InventoryProduct[] {
    return Array.from(this.inventoryProducts.values())
  }

  updateInventoryProduct(id: number, updates: Partial<InventoryProduct>): InventoryProduct | undefined {
    const product = this.inventoryProducts.get(id)
    if (!product) return undefined

    const updated = { ...product, ...updates, updatedAt: new Date() }
    this.inventoryProducts.set(id, updated)
    return updated
  }

  deleteInventoryProduct(id: number): boolean {
    return this.inventoryProducts.delete(id)
  }

  updateStock(id: number, quantity: number): InventoryProduct | undefined {
    const product = this.inventoryProducts.get(id)
    if (!product) return undefined

    product.stock += quantity
    product.updatedAt = new Date()
    this.inventoryProducts.set(id, product)
    return product
  }

  getLowStockProducts(): InventoryProduct[] {
    return Array.from(this.inventoryProducts.values()).filter((p) => p.stock <= p.lowStockThreshold)
  }

  // Customers
  createCustomer(customer: Customer): Customer {
    this.customers.set(customer.id, customer)
    return customer
  }

  getCustomer(id: string): Customer | undefined {
    return this.customers.get(id)
  }

  getAllCustomers(): Customer[] {
    return Array.from(this.customers.values())
  }

  updateCustomer(id: string, updates: Partial<Customer>): Customer | undefined {
    const customer = this.customers.get(id)
    if (!customer) return undefined

    const updated = { ...customer, ...updates }
    this.customers.set(id, updated)
    return updated
  }

  getTopCustomers(limit = 10): Customer[] {
    return Array.from(this.customers.values())
      .sort((a, b) => b.totalPurchases - a.totalPurchases)
      .slice(0, limit)
  }

  // Suppliers
  createSupplier(supplier: Supplier): Supplier {
    this.suppliers.set(supplier.id, supplier)
    return supplier
  }

  getSupplier(id: number): Supplier | undefined {
    return this.suppliers.get(id)
  }

  getAllSuppliers(): Supplier[] {
    return Array.from(this.suppliers.values())
  }

  updateSupplier(id: number, updates: Partial<Supplier>): Supplier | undefined {
    const supplier = this.suppliers.get(id)
    if (!supplier) return undefined

    const updated = { ...supplier, ...updates }
    this.suppliers.set(id, updated)
    return updated
  }

  deleteSupplier(id: number): boolean {
    return this.suppliers.delete(id)
  }

  // Sales
  createSale(sale: Sale): Sale {
    this.sales.set(sale.id, sale)

    // Update customer purchase history
    if (sale.customerId) {
      const customer = this.customers.get(sale.customerId)
      if (customer) {
        customer.totalPurchases += sale.total
        customer.lastPurchaseDate = sale.createdAt
        this.customers.set(sale.customerId, customer)
      }
    }

    // Update inventory stock
    sale.items.forEach((item) => {
      this.updateStock(item.productId, -item.quantity)
    })

    return sale
  }

  getSale(id: string): Sale | undefined {
    return this.sales.get(id)
  }

  getAllSales(): Sale[] {
    return Array.from(this.sales.values())
  }

  getSalesByDateRange(startDate: Date, endDate: Date): Sale[] {
    return Array.from(this.sales.values()).filter((sale) => sale.createdAt >= startDate && sale.createdAt <= endDate)
  }

  getSalesByCustomer(customerId: string): Sale[] {
    return Array.from(this.sales.values()).filter((sale) => sale.customerId === customerId)
  }

  // Analytics
  getTodaySales(): number {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Array.from(this.sales.values())
      .filter((sale) => sale.createdAt >= today)
      .reduce((sum, sale) => sum + sale.total, 0)
  }

  getWeekSales(): number {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return Array.from(this.sales.values())
      .filter((sale) => sale.createdAt >= weekAgo)
      .reduce((sum, sale) => sum + sale.total, 0)
  }

  getMonthSales(): number {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return Array.from(this.sales.values())
      .filter((sale) => sale.createdAt >= monthAgo)
      .reduce((sum, sale) => sum + sale.total, 0)
  }

  getTopSellingProducts(limit = 5): { productId: number; productName: string; totalSold: number }[] {
    const productSales = new Map<number, { name: string; quantity: number }>()

    Array.from(this.sales.values()).forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productSales.get(item.productId)
        if (existing) {
          existing.quantity += item.quantity
        } else {
          productSales.set(item.productId, { name: item.productName, quantity: item.quantity })
        }
      })
    })

    return Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        totalSold: data.quantity,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit)
  }

  // Payments
  createPayment(payment: Payment): Payment {
    this.payments.set(payment.id, payment)
    return payment
  }

  getPayment(id: string): Payment | undefined {
    return this.payments.get(id)
  }

  getPaymentsByCustomer(customerId: string): Payment[] {
    return Array.from(this.payments.values()).filter((p) => p.customerId === customerId)
  }

  getPaymentsByOrder(orderId: string): Payment | undefined {
    return Array.from(this.payments.values()).find((p) => p.orderId === orderId)
  }

  updatePaymentStatus(id: string, status: PaymentStatus): Payment | undefined {
    const payment = this.payments.get(id)
    if (!payment) return undefined
    payment.status = status
    if (status === "completed") payment.completedAt = new Date()
    this.payments.set(id, payment)
    return payment
  }

  // Wallets
  createWallet(wallet: Wallet): Wallet {
    this.wallets.set(wallet.id, wallet)
    return wallet
  }

  getWallet(customerId: string): Wallet | undefined {
    return Array.from(this.wallets.values()).find((w) => w.customerId === customerId)
  }

  updateWalletBalance(customerId: string, amount: number): Wallet | undefined {
    const wallet = Array.from(this.wallets.values()).find((w) => w.customerId === customerId)
    if (!wallet) return undefined
    wallet.balance += amount
    if (amount > 0) wallet.totalEarned += amount
    wallet.totalSpent += Math.abs(amount)
    wallet.updatedAt = new Date()
    this.wallets.set(wallet.id, wallet)
    return wallet
  }

  // Wallet Transactions
  createWalletTransaction(transaction: WalletTransaction): WalletTransaction {
    this.walletTransactions.set(transaction.id, transaction)
    return transaction
  }

  getWalletTransactions(walletId: string): WalletTransaction[] {
    return Array.from(this.walletTransactions.values()).filter((t) => t.walletId === walletId)
  }

  // Refunds
  createRefund(refund: Refund): Refund {
    this.refunds.set(refund.id, refund)
    return refund
  }

  getRefund(id: string): Refund | undefined {
    return this.refunds.get(id)
  }

  getRefundsByCustomer(customerId: string): Refund[] {
    return Array.from(this.refunds.values()).filter((r) => {
      const payment = this.payments.get(r.paymentId)
      return payment?.customerId === customerId
    })
  }

  updateRefundStatus(id: string, status: "pending" | "approved" | "rejected" | "completed"): Refund | undefined {
    const refund = this.refunds.get(id)
    if (!refund) return undefined
    refund.status = status
    if (status === "completed") refund.processedAt = new Date()
    this.refunds.set(id, refund)
    return refund
  }

  // Loyalty Accounts
  createLoyaltyAccount(account: LoyaltyAccount): LoyaltyAccount {
    this.loyaltyAccounts.set(account.id, account)
    return account
  }

  getLoyaltyAccount(customerId: string): LoyaltyAccount | undefined {
    return Array.from(this.loyaltyAccounts.values()).find((a) => a.customerId === customerId)
  }

  updateLoyaltyPoints(customerId: string, points: number): LoyaltyAccount | undefined {
    const account = Array.from(this.loyaltyAccounts.values()).find((a) => a.customerId === customerId)
    if (!account) return undefined

    account.points += points
    if (points > 0) account.totalPointsEarned += points
    if (points < 0) account.totalPointsRedeemed += Math.abs(points)
    account.updatedAt = new Date()

    // Update tier based on points
    if (account.points >= 5000) account.tier = "platinum"
    else if (account.points >= 3000) account.tier = "gold"
    else if (account.points >= 1000) account.tier = "silver"
    else account.tier = "bronze"

    this.loyaltyAccounts.set(account.id, account)
    return account
  }

  // Loyalty Transactions
  createLoyaltyTransaction(transaction: LoyaltyTransaction): LoyaltyTransaction {
    this.loyaltyTransactions.set(transaction.id, transaction)
    return transaction
  }

  getLoyaltyTransactions(loyaltyAccountId: string): LoyaltyTransaction[] {
    return Array.from(this.loyaltyTransactions.values()).filter((t) => t.loyaltyAccountId === loyaltyAccountId)
  }

  // Loyalty Rewards
  createLoyaltyReward(reward: LoyaltyReward): LoyaltyReward {
    this.loyaltyRewards.set(reward.id, reward)
    return reward
  }

  getAllLoyaltyRewards(): LoyaltyReward[] {
    return Array.from(this.loyaltyRewards.values()).filter((r) => r.expiresAt > new Date())
  }

  // Customer Redemptions
  createCustomerRedemption(redemption: CustomerRedemption): CustomerRedemption {
    this.customerRedemptions.set(redemption.id, redemption)
    return redemption
  }

  getCustomerRedemptions(customerId: string): CustomerRedemption[] {
    return Array.from(this.customerRedemptions.values()).filter((r) => r.customerId === customerId)
  }

  updateRedemptionStatus(id: string, status: "active" | "used" | "expired"): CustomerRedemption | undefined {
    const redemption = this.customerRedemptions.get(id)
    if (!redemption) return undefined
    redemption.status = status
    if (status === "used") redemption.usedAt = new Date()
    this.customerRedemptions.set(id, redemption)
    return redemption
  }

  // Vendor Reviews
  createVendorReview(review: VendorReview): VendorReview {
    this.vendorReviews.set(review.id, review)
    this.updateVendorPerformance(review.vendorId)
    return review
  }

  getVendorReviews(vendorId: string): VendorReview[] {
    return Array.from(this.vendorReviews.values()).filter((r) => r.vendorId === vendorId)
  }

  getReview(id: string): VendorReview | undefined {
    return this.vendorReviews.get(id)
  }

  updateReviewHelpful(id: string, helpful: boolean): VendorReview | undefined {
    const review = this.vendorReviews.get(id)
    if (!review) return undefined
    if (helpful) review.helpful += 1
    else review.unhelpful += 1
    this.vendorReviews.set(id, review)
    return review
  }

  // Vendor Performance
  getVendorPerformance(vendorId: string): VendorPerformance | undefined {
    return this.vendorPerformance.get(vendorId)
  }

  updateVendorPerformance(vendorId: string): VendorPerformance | undefined {
    const reviews = this.getVendorReviews(vendorId)
    if (reviews.length === 0) return undefined

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    const avgFoodQuality = reviews.reduce((sum, r) => sum + r.foodQuality, 0) / reviews.length
    const avgDeliveryTime = reviews.reduce((sum, r) => sum + r.deliveryTime, 0) / reviews.length
    const avgCustomerService = reviews.reduce((sum, r) => sum + r.customerService, 0) / reviews.length

    const badges: string[] = []
    if (avgRating >= 4.5) badges.push("top_rated")
    if (avgDeliveryTime >= 4.0) badges.push("fast_delivery")
    if (avgCustomerService >= 4.5) badges.push("excellent_service")

    let tier: "bronze" | "silver" | "gold" | "platinum" = "bronze"
    if (reviews.length >= 100 && avgRating >= 4.7) tier = "platinum"
    else if (reviews.length >= 50 && avgRating >= 4.5) tier = "gold"
    else if (reviews.length >= 20 && avgRating >= 4.3) tier = "silver"

    const performance: VendorPerformance = {
      vendorId,
      totalReviews: reviews.length,
      averageRating: avgRating,
      foodQualityRating: avgFoodQuality,
      deliveryTimeRating: avgDeliveryTime,
      customerServiceRating: avgCustomerService,
      responseRate: 85,
      responseTime: 2,
      badges,
      tier,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.vendorPerformance.set(vendorId, performance)
    return performance
  }

  getTopRatedVendors(limit = 10): VendorPerformance[] {
    return Array.from(this.vendorPerformance.values())
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit)
  }

  // Vendor Responses
  createVendorResponse(response: VendorResponse): VendorResponse {
    this.vendorResponses.set(response.id, response)
    return response
  }

  getReviewResponses(reviewId: string): VendorResponse[] {
    return Array.from(this.vendorResponses.values()).filter((r) => r.reviewId === reviewId)
  }

  // Conversations
  createConversation(conversation: Conversation): Conversation {
    this.conversations.set(conversation.id, conversation)
    return conversation
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id)
  }

  getConversationsByUser(userId: string): Conversation[] {
    return Array.from(this.conversations.values()).filter((c) => c.participantIds.includes(userId))
  }

  getOrCreateConversation(
    participantIds: string[],
    participantRoles: ChatParticipantRole[],
    type: Conversation["type"],
    orderId?: string,
  ): Conversation {
    const existing = Array.from(this.conversations.values()).find(
      (c) =>
        c.type === type &&
        c.participantIds.length === participantIds.length &&
        c.participantIds.every((id) => participantIds.includes(id)),
    )

    if (existing) return existing

    const conversation: Conversation = {
      id: `conv-${Date.now()}`,
      participantIds,
      participantRoles,
      type,
      relatedOrderId: orderId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return this.createConversation(conversation)
  }

  // Chat Messages
  createChatMessage(message: ChatMessage): ChatMessage {
    this.chatMessages.set(message.id, message)

    // Update conversation last message
    const conversation = this.conversations.get(message.conversationId)
    if (conversation) {
      conversation.lastMessage = message.message
      conversation.lastMessageTime = message.createdAt
      conversation.updatedAt = new Date()
      this.conversations.set(message.conversationId, conversation)
    }

    return message
  }

  getChatMessages(conversationId: string, limit = 50): ChatMessage[] {
    return Array.from(this.chatMessages.values())
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(-limit)
  }

  markMessagesAsRead(conversationId: string, userId: string): void {
    Array.from(this.chatMessages.values())
      .filter((m) => m.conversationId === conversationId && m.senderId !== userId && !m.isRead)
      .forEach((m) => {
        m.isRead = true
        this.chatMessages.set(m.id, m)
      })
  }

  // Support Tickets
  createSupportTicket(ticket: SupportTicket): SupportTicket {
    this.supportTickets.set(ticket.id, ticket)
    return ticket
  }

  getSupportTicket(id: string): SupportTicket | undefined {
    return this.supportTickets.get(id)
  }

  getSupportTicketsByCustomer(customerId: string): SupportTicket[] {
    return Array.from(this.supportTickets.values()).filter((t) => t.customerId === customerId)
  }

  getOpenSupportTickets(): SupportTicket[] {
    return Array.from(this.supportTickets.values()).filter((t) => t.status !== "closed")
  }

  updateSupportTicketStatus(id: string, status: TicketStatus, assignedTo?: string): SupportTicket | undefined {
    const ticket = this.supportTickets.get(id)
    if (!ticket) return undefined

    ticket.status = status
    ticket.updatedAt = new Date()
    if (assignedTo) ticket.assignedTo = assignedTo
    if (status === "resolved") ticket.resolvedAt = new Date()

    this.supportTickets.set(id, ticket)
    return ticket
  }

  addMessageToTicket(ticketId: string, message: ChatMessage): SupportTicket | undefined {
    const ticket = this.supportTickets.get(ticketId)
    if (!ticket) return undefined

    ticket.messages.push(message)
    ticket.updatedAt = new Date()
    this.supportTickets.set(ticketId, ticket)
    return ticket
  }

  // Delivery Routes
  createDeliveryRoute(route: DeliveryRoute): DeliveryRoute {
    this.deliveryRoutes.set(route.id, route)
    return route
  }

  getDeliveryRoute(id: string): DeliveryRoute | undefined {
    return this.deliveryRoutes.get(id)
  }

  getDriverRoutes(driverId: string): DeliveryRoute[] {
    return Array.from(this.deliveryRoutes.values()).filter((r) => r.driverId === driverId)
  }

  updateRouteStatus(id: string, status: "planned" | "in_progress" | "completed"): DeliveryRoute | undefined {
    const route = this.deliveryRoutes.get(id)
    if (!route) return undefined
    route.status = status
    if (status === "completed") route.completedAt = new Date()
    this.deliveryRoutes.set(id, route)
    return route
  }

  // Delivery Zones
  createDeliveryZone(zone: DeliveryZone): DeliveryZone {
    this.deliveryZones.set(zone.id, zone)
    return zone
  }

  getDeliveryZone(id: string): DeliveryZone | undefined {
    return this.deliveryZones.get(id)
  }

  getDeliveryZonesByCity(city: string): DeliveryZone[] {
    return Array.from(this.deliveryZones.values()).filter((z) => z.city === city)
  }

  getAllDeliveryZones(): DeliveryZone[] {
    return Array.from(this.deliveryZones.values())
  }

  updateZoneActiveDrivers(zoneId: string, count: number): DeliveryZone | undefined {
    const zone = this.deliveryZones.get(zoneId)
    if (!zone) return undefined
    zone.activeDrivers = count
    return zone
  }

  // Driver Performance
  createDriverPerformance(performance: DriverPerformance): DriverPerformance {
    this.driverPerformance.set(performance.driverId, performance)
    return performance
  }

  getDriverPerformance(driverId: string): DriverPerformance | undefined {
    return this.driverPerformance.get(driverId)
  }

  updateDriverPerformance(driverId: string, updates: Partial<DriverPerformance>): DriverPerformance | undefined {
    const performance = this.driverPerformance.get(driverId)
    if (!performance) return undefined
    const updated = { ...performance, ...updates, updatedAt: new Date() }
    this.driverPerformance.set(driverId, updated)
    return updated
  }

  getTopPerformingDrivers(limit = 10): DriverPerformance[] {
    return Array.from(this.driverPerformance.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)
  }

  // Notifications
  createNotification(notification: Notification): Notification {
    this.notifications.set(notification.id, notification)
    return notification
  }

  getNotifications(userId: string): Notification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.recipientId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  markNotificationAsRead(id: string): Notification | undefined {
    const notification = this.notifications.get(id)
    if (!notification) return undefined
    notification.isRead = true
    notification.readAt = new Date()
    this.notifications.set(id, notification)
    return notification
  }

  // Driver Location Tracking
  updateDriverLocation(driverId: string, location: DriverLocation): DriverLocation {
    this.driverLocations.set(driverId, { ...location, updatedAt: new Date() })
    return this.driverLocations.get(driverId)!
  }

  getDriverLocation(driverId: string): DriverLocation | undefined {
    return this.driverLocations.get(driverId)
  }

  getNearbyDrivers(lat: number, lng: number, radiusKm = 5): DriverLocation[] {
    return Array.from(this.driverLocations.values()).filter((loc) => {
      const distance = Math.sqrt(Math.pow(loc.latitude - lat, 2) + Math.pow(loc.longitude - lng, 2)) * 111
      return distance <= radiusKm
    })
  }

  getAvailableDriversInZone(zoneId: string): DriverLocation[] {
    const zone = this.deliveryZones.get(zoneId)
    if (!zone) return []

    return Array.from(this.driverLocations.values()).filter((loc) => {
      // Check if driver is within zone coordinates
      const isInZone = zone.coordinates.some((coord) => {
        const distance = Math.sqrt(Math.pow(loc.latitude - coord.lat, 2) + Math.pow(loc.longitude - coord.lng, 2)) * 111
        return distance <= 2 // Within 2km of zone
      })
      return isInZone
    })
  }
}

// Singleton instance
export const db = new Database()

// Initialize with some mock data
export function initializeMockData() {
  // Create mock vendors
  const vendor1: User = {
    id: "vendor-1",
    name: "Le Taj Mahal Owner",
    email: "vendor1@tajmahal.dz",
    phone: "+213555123456",
    role: "vendor",
    createdAt: new Date(),
  }

  const vendor2: User = {
    id: "vendor-2",
    name: "Pizza Napoli Owner",
    email: "vendor2@napoli.dz",
    phone: "+213555234567",
    role: "vendor",
    createdAt: new Date(),
  }

  db.createUser(vendor1)
  db.createUser(vendor2)

  // Create mock drivers
  const driver1: User = {
    id: "driver-1",
    name: "Ahmed Benali",
    email: "ahmed@albaz.dz",
    phone: "+213555345678",
    role: "driver",
    createdAt: new Date(),
  }

  const driver2: User = {
    id: "driver-2",
    name: "Fatima Khelifi",
    email: "fatima@albaz.dz",
    phone: "+213555456789",
    role: "driver",
    createdAt: new Date(),
  }

  db.createUser(driver1)
  db.createUser(driver2)

  // Create mock stores
  const store1: Store = {
    id: 1,
    name: "Le Taj Mahal",
    type: "Cuisine Indienne",
    rating: 4.5,
    deliveryTime: "30-45 min",
    categoryId: 1,
    vendorId: "vendor-1",
    address: "123 Rue Didouche Mourad, Alger",
    city: "Alger",
  }

  const store2: Store = {
    id: 4,
    name: "Pizza Napoli",
    type: "Pizzeria",
    rating: 4.6,
    deliveryTime: "25-35 min",
    categoryId: 1,
    vendorId: "vendor-2",
    address: "456 Boulevard Mohamed V, Alger",
    city: "Alger",
  }

  db.createStore(store1)
  db.createStore(store2)

  // Create mock products
  const products: Product[] = [
    {
      id: 1,
      storeId: 1,
      name: "Poulet Tikka Masala",
      description: "Poulet mariné dans une sauce crémeuse aux épices",
      price: 1200,
      image: "/chicken-tikka-masala.png",
      rating: 4.5,
      available: true,
    },
    {
      id: 2,
      storeId: 1,
      name: "Biryani aux Légumes",
      description: "Riz basmati parfumé avec légumes et épices",
      price: 900,
      image: "/vegetable-biryani.png",
      rating: 4.7,
      available: true,
    },
    {
      id: 7,
      storeId: 4,
      name: "Pizza Margherita",
      description: "Tomate, mozzarella, basilic frais",
      price: 1100,
      image: "/margherita-pizza.png",
      rating: 4.8,
      available: true,
    },
    {
      id: 8,
      storeId: 4,
      name: "Pizza 4 Fromages",
      description: "Mozzarella, gorgonzola, parmesan, chèvre",
      price: 1300,
      image: "/four-cheese-pizza.png",
      rating: 4.6,
      available: true,
    },
  ]

  products.forEach((product) => db.createProduct(product))
}
