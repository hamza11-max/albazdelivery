# AlBaz Customer App – Analysis

## Overview

The customer app (`@albaz/customer`) is a **Next.js 15** mobile-first web application for **AlBaz** (الباز), a fast delivery platform targeting Algeria. It enables end-users to browse stores, order products, and track deliveries.

---

## Architecture

| Aspect | Details |
|--------|---------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + custom design system |
| **State** | React Query (TanStack Query) + local state |
| **Auth** | NextAuth v5 (Credentials + Google) |
| **Data** | Prisma + PostgreSQL |

---

## Core Features

### 1. **User Flow**
- **Login** (`/login`): Email/phone + password or Google OAuth
- **Signup** (`/signup`): Registration flow
- **Role-based redirect**: Non-customers (Admin, Vendor, Driver) are redirected to their respective apps

### 2. **Main Views** (single-page navigation)
- **Home** – Categories, search, city selector, dark mode toggle
- **Category** – Stores filtered by selected category
- **Store** – Product listing with add-to-cart
- **Checkout** – Cart summary, promo codes, payment method selection
- **Orders** – Order history list
- **Tracking** – Live order status with SSE updates
- **Profile** – Language, theme, sign out

### 3. **Bottom Navigation**
- Home, Search, Cart (with badge), Orders/Notifications, Profile

---

## Technical Details

### **Data Flow**
- **Categories**: React Query → `/api/categories`
- **Stores**: React Query → `/api/stores` (filtered by category, city, search)
- **Products**: React Query → `/api/products` (by store)
- **Orders**: Mutation → `/api/orders` (create), polling + SSE for tracking

### **Real-time**
- **SSE** (`useSSE`): Order updates on tracking page
- **WebSocket** (`useRealtimeUpdates`): Cache invalidation for orders, stores, products
- **Polling**: Every 5s on tracking page if SSE fails

### **API Client** (`lib/api-client.ts`)
- Centralized API with retry (exponential backoff)
- Covers: orders, products, stores, categories, wallet, loyalty, notifications, payments, package delivery, support, reviews

### **Internationalization**
- French (fr) and Arabic (ar)
- RTL support for Arabic
- `TranslationFn` for key-based translations

### **Design System**
- Colors: `--albaz-dark-green`, `--albaz-orange`, `--albaz-light-green`
- Dark mode
- Safe-area handling for mobile
- Skip link for accessibility

---

## Strengths

1. **Mobile-first**: Bottom nav, touch-friendly layout
2. **Resilience**: Retry logic, SSE + polling fallback
3. **Real-time**: SSE and WebSocket for live updates
4. **Bilingual**: French/Arabic with RTL
5. **Shared packages**: Uses `@albaz/ui`, `@albaz/auth`, `@albaz/shared`
6. **Error handling**: Error boundary, toast notifications, `useErrorHandler`

---

## Areas for Improvement

### Critical (blocks production readiness)

1. **Hardcoded delivery address & phone** in `placeOrder`:
   - `deliveryAddress: '123 Rue Example, Appartement 4'`
   - `customerPhone: '+213555000000'`
   - Must come from user profile or saved addresses

2. **Promo codes**: Only `WELCOME10` and `SAVE15` hardcoded; no database-backed promo system

3. **Fixed delivery fee**: `deliveryFee = 500` DZD; should be configurable or zone-based (Prisma has `DeliveryZone`)

4. **Package delivery**: Uses `customerId: "customer-1"`; not authenticated; API expects different fields (`deliveryAddress`, `city` vs `fromLocation`/`toLocation`)

### Medium (UX & quality)

5. **Login flow**: Uses custom fetch to `/api/auth/signin/credentials` instead of `signIn()` from NextAuth

6. **Edit profile**: Button exists but does nothing; no profile edit screen

7. **Profile menu items**: Notifications, Addresses, Help & Support are non-functional (no navigation)

8. **Track by order ID**: "Track" tab in MyOrdersView has input + button but no logic to fetch/track

9. **Search**: Search button in bottom nav does not focus search input; search may not filter correctly

10. **Card payment**: Disabled in checkout ("Coming soon"); Stripe/payment APIs exist but not wired

11. **Tax**: Always 0 DZD in checkout summary

### Low (cleanup & polish)

12. **Debug logging**: `[v0]` logs in production; gate behind `NODE_ENV` or remove

13. **Status casing**: Inconsistent (`pending` vs `PENDING`, `IN_DELIVERY` vs `in_delivery`) in `getStepFromStatus` and `formatStatus`

14. **Order status coverage**: `formatStatus` in MyOrdersView only handles DELIVERED, IN_DELIVERY; others show "En Attente"

---

## Features to Implement

### High priority (core value)

| Feature | Description | API/DB support |
|--------|-------------|----------------|
| **Saved addresses** | Add/edit/delete delivery addresses; select at checkout | New `Address` model or extend User |
| **User profile edit** | Edit name, phone, email | User update API |
| **Dynamic delivery fee** | Fee by city/zone, distance, or order value | `DeliveryZone` model exists |
| **Database promo codes** | Create `PromoCode` model; validate at checkout | New model + API |
| **Card/Wallet payment** | Enable Stripe or wallet payment | `paymentsAPI`, `walletAPI`, Stripe webhooks exist |

### Medium priority (engagement)

| Feature | Description | API/DB support |
|--------|-------------|----------------|
| **Order tracking by ID** | Guest or logged-in user enters order ID to track | `ordersAPI.getById` |
| **Order reviews** | Rate vendor/order after delivery | `reviewsAPI`, `Review` model |
| **Notifications center** | List, read, manage notifications | `notificationsAPI`, `Notification` model |
| **Wallet & balance** | View balance, add funds, pay with wallet | `walletAPI`, `Wallet` model |
| **Loyalty program** | Points, tiers, redeem rewards | `loyaltyAPI`, `LoyaltyAccount`, `LoyaltyReward` |
| **Package delivery integration** | Wire package form to API; use session user; fix field mapping | `packageDeliveryAPI` |

### Lower priority (nice to have)

| Feature | Description | API/DB support |
|--------|-------------|----------------|
| **Support tickets** | Create/view tickets, chat with support | `supportAPI`, `SupportTicket` |
| **Driver live location** | Show driver on map during delivery | `driverAPI.getLocation`, `DriverLocation` |
| **Scheduled delivery** | Choose date/time for orders | `Order.scheduledDate`, `scheduledTime` |
| **Order reorder** | One-tap reorder from past orders | Use existing order items |
| **Favorites / recently viewed** | Save stores or products | New model or localStorage |
| **Push notifications** | Browser/mobile push for order updates | Service worker + backend |
| **Referral program** | Share code, earn rewards | `LoyaltyAccount.referralCode` |

### UI/UX improvements

- **Search focus**: Wire Search nav button to focus home search input
- **Loading states**: Skeleton loaders for store/product lists
- **Empty states**: Better illustrations/messages for empty cart, no orders
- **Error recovery**: Retry buttons, clearer error messages
- **Accessibility**: ARIA labels, focus management, screen reader support
- **Offline support**: Service worker for basic offline viewing

---

## File Structure (High Level)

```
apps/customer/
├── app/
│   ├── layout.tsx          # Root layout (QueryProvider, ThemeInitializer, ErrorBoundary)
│   ├── page.tsx            # Main SPA (AlBazApp)
│   ├── login/page.tsx
│   ├── signup/...
│   ├── globals.css
│   └── api/auth/[...nextauth]/route.ts
├── components/
│   ├── navigation/BottomNav.tsx
│   ├── views/HomePage, CategoryView, StoreView, CheckoutView, etc.
│   └── CategoryIcon
├── hooks/
│   ├── use-categories-query, use-stores-query, use-products-query
│   ├── use-orders-mutation, use-realtime-updates
│   ├── use-sse, use-websocket, use-error-handler
│   └── ...
├── lib/
│   ├── api-client.ts       # Centralized API
│   ├── auth.ts, auth.config.ts
│   ├── mock-data.ts        # Categories (stores/products from API)
│   ├── types.ts
│   └── theme.ts
└── providers/query-provider.tsx
```

---

## Dependencies

- **UI**: `@albaz/ui`, `lucide-react`, `clsx`, `tailwind-merge`
- **Data**: `@tanstack/react-query`
- **Auth**: `next-auth`
- **Shared**: `@albaz/auth`, `@albaz/shared`

---

## Summary

The customer app is well-structured for a delivery platform with solid real-time support and bilingual UX. The main gaps are address/phone handling, promo logic, and delivery fee configuration.
