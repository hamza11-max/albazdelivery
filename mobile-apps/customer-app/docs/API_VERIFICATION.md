# Customer app – API verification (Web vs Expo)

Comparison of **apps/customer** (web) `lib/api-client.ts` with **mobile-apps/customer-app** `services/api-client.ts`.

## Implemented in Expo and used in UI

| API | Web | Expo client | Used in Expo UI |
|-----|-----|-------------|------------------|
| **categoriesAPI.list** | ✅ | ✅ | ✅ HomeScreen |
| **categoriesAPI.getById** | ✅ | ✅ | — |
| **storesAPI.list** | ✅ | ✅ | ✅ CategoryScreen |
| **storesAPI.getById** | ✅ | ✅ | — |
| **productsAPI.list** | ✅ | ✅ | ✅ StoreScreen |
| **ordersAPI.list** | ✅ | ✅ | ✅ OrdersScreen |
| **ordersAPI.getById** | ✅ | ✅ | ✅ TrackingScreen (status + driver, call driver) |
| **ordersAPI.getTrack** | ✅ (web track) | ✅ | — (client ready for live location) |
| **ordersAPI.create** | ✅ | ✅ | ✅ CheckoutScreen, PackageDeliveryScreen |
| **ordersAPI.updateStatus** | ✅ | ✅ | ✅ TrackingScreen (Cancel order) |
| **deliveryAPI.getFee** | ✅ | ✅ | ✅ CheckoutScreen |
| **addressesAPI** (list, create, delete) | ✅ | ✅ | ✅ AddressesScreen, ✅ CheckoutScreen (saved address picker) |
| **walletAPI** (getBalance, getTransactions, addFunds) | ✅ | ✅ | ✅ WalletScreen |
| **promoAPI.validate** | ✅ POST | ✅ POST | ✅ CheckoutScreen |
| **packageDeliveryAPI.create** | ✅ | ✅ | ✅ PackageDeliveryScreen |
| **notificationsAPI** (list, markAsRead, markAllAsRead) | ✅ | ✅ | ✅ NotificationsScreen (+ 🔔 from Home) |
| **loyaltyAPI** (getAccount, getRewards, redeemReward) | ✅ | ✅ | ✅ LoyaltyScreen |
| **reviewsAPI.create** | ✅ | ✅ | ✅ ReviewScreen (from TrackingScreen) |
| **supportAPI** | ✅ | ✅ | ✅ SupportScreen (contact info) |
| **Auth** | NextAuth | /api/auth/login | ✅ LoginScreen |

---

## Profile menu (icons + pages)

From **ProfileScreen**, the following items open dedicated screens (with emoji icons):

| Icon | Label | Screen |
|------|--------|--------|
| 💰 | Portefeuille | WalletScreen |
| 📍 | Adresses | AddressesScreen |
| 🔔 | Notifications | NotificationsScreen |
| 🎁 | Fidélité | LoyaltyScreen |
| 💬 | Support | SupportScreen |

- **Home** header 🔔 opens NotificationsScreen (back returns to Home).
- **TrackingScreen**: "Annuler la commande" (when PENDING), driver card + "Appeler le chauffeur" (when assigned), "Laisser un avis" (when DELIVERED) → ReviewScreen.

---

## Optional / not yet wired in UI

- **ordersAPI.getTrack** – client has `getTrack(orderId)`; use for live driver location / map when needed.
- **paymentsAPI** (create, createIntent, getHistory) – for card payment flow if backend supports it.
- **reviewsAPI** (list, markHelpful, addResponse) – only `create` is used from ReviewScreen.
- **addressesAPI.update** – implemented in client; AddressesScreen could add edit flow.
