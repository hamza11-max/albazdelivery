# Vendor App - Comprehensive Analysis

## Overview

The Vendor App is a comprehensive Point of Sale (POS) and business management system designed for vendors to manage their inventory, sales, customers, suppliers, and operations. It supports both web and Electron desktop environments with offline capabilities.

In addition to the back-office, every vendor now gets a **public branded storefront** (take.app-style) reachable on a vendor subdomain (`<slug>.albazdelivery.com`) or an optional custom domain (`shop.yourbrand.com`). The storefront is a full ordering experience — catalog, cart, guest checkout — that funnels orders into the same `Order` pipeline and WhatsApp vendor notifications used everywhere else in the platform.

**Last Updated:** April 2026

---

## Table of Contents

1. [Architecture](#architecture)
2. [Core Features](#core-features)
3. [Component Structure](#component-structure)
4. [Key Functionalities](#key-functionalities)
5. [Technology Stack](#technology-stack)
6. [Data Management](#data-management)
7. [Offline Support](#offline-support)
8. [API Integration](#api-integration)
9. [User Interface](#user-interface)
10. [Security & Authentication](#security--authentication)
11. [Public Storefront (Vendor Subdomains & Custom Domains)](#public-storefront-vendor-subdomains--custom-domains)
12. [WhatsApp API Strategy](#whatsapp-api-strategy)
13. [Restaurant Version Analysis](#restaurant-version-analysis)

---

## Architecture

### Platform Support
- **Web Application**: Next.js-based web app
- **Desktop Application**: Electron wrapper for offline functionality
- **Responsive Design**: Mobile-friendly interface

### Project Structure
```
apps/vendor/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── vendor/            # Main vendor dashboard
│   └── login/             # Authentication
├── components/            # React components
│   ├── dialogs/          # Modal dialogs
│   └── tabs/             # Tab components
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
├── electron/              # Electron-specific code
└── lib/                   # Shared libraries
```

---

## Core Features

### 1. Point of Sale (POS) System
- **Real-time Cart Management**
  - Add/remove products
  - Quantity adjustment
  - Custom item addition (non-inventory items)
  - Manual price override
  - Discount application (fixed amount or percentage)
  
- **Product Search & Barcode Scanning**
  - Real-time product search
  - Barcode scanner integration
  - Category filtering
  
- **Order Summary**
  - Itemized cart display
  - Subtotal calculation
  - Discount application
  - Manual total override
  - Order number generation
  
- **Payment Processing**
  - Cash payment
  - Card payment
  - Receipt generation

### 2. Inventory Management
- **Product Management**
  - Add/Edit/Delete products
  - Product categories
  - SKU management
  - Stock tracking
  - Price management
  - Product images
  
- **Stock Monitoring**
  - Low stock alerts
  - Real-time inventory updates
  - Stock history

### 3. Sales Management
- **Sales History**
  - Complete sales records
  - Filtering and search
  - Sales analytics
  
- **Invoice Generation**
  - Professional invoice template
  - A4 format printing
  - PDF export
  - Barcode for refunds
  - System printer selection
  
- **Receipt Management**
  - Digital receipts
  - Print receipts
  - Receipt customization

### 4. Customer Management
- **Customer Database**
  - Add/Edit customers
  - Customer information storage
  - Customer history
  - Contact management

### 5. Supplier Management
- **Supplier Database**
  - Supplier information
  - Contact details
  - Supplier relationship tracking

### 6. Order Management
- **Order Processing**
  - Order status tracking
  - Driver assignment
  - Order updates
  - Order history

### 7. Staff Management
- **Employee Management**
  - Add/Edit/Delete staff members
  - Role assignment (Owner, Manager, Cashier, Staff)
  - Password management
  - Staff access control

### 8. Business Hours Management
- **Operating Hours**
  - Day-wise schedule configuration
  - Opening/closing hours
  - Weekend configuration (Friday & Saturday)
  - Open/Closed status toggle

### 9. Dashboard & Analytics
- **Sales Metrics**
  - Today's sales
  - Weekly sales
  - Monthly sales
  
- **Product Analytics**
  - Top-selling products
  - Low stock alerts
  - Quick actions

### 10. AI Insights
- **Business Intelligence**
  - AI-powered insights
  - Sales predictions
  - Business recommendations

### 11. Driver Management
- **Delivery Drivers**
  - Driver requests
  - Driver status
  - Driver assignment

### 12. Settings & Configuration
- **Shop Information**
  - Shop name, address, contact
  - Logo upload
  - Cover photo
  
- **Receipt Settings**
  - Footer messages
  - Auto-print options
  
- **Appearance**
  - Dark mode toggle
  - Language selection (French/Arabic)

### 13. Public Storefront & Custom Domains (take.app-style)
- **Vendor Subdomain**
  - Free `<slug>.albazdelivery.com` storefront on every plan
  - Live availability validation against reserved labels (`admin`, `api`, `vendor`, etc.)
  - Sharable preview link once status is `VERIFIED`
  
- **Custom Domain (paid plans)**
  - Bring your own apex/subdomain (`shop.yourbrand.com`)
  - DNS-based ownership verification (TXT + CNAME)
  - Auto-attached to the Vercel project for free SSL on successful verification
  - Subscription-gated: STARTER blocked, PROFESSIONAL+ allowed (vendor + 1 store), BUSINESS (5 stores), ENTERPRISE (unlimited)
  
- **Branded Storefront UX**
  - Catalog grouped by store with hero, accent color, tagline, and logo
  - Product detail pages with add-to-cart
  - Persistent cart (localStorage, scoped per vendor)
  - Guest checkout (name, phone, address, payment method)
  - Order confirmation page protected by an opaque signed token
  
- **Order Funnel Reuse**
  - Storefront orders flow through the same `createOrderInternal` used by WhatsApp & customer apps
  - Existing WhatsApp vendor notifications, loyalty accrual, and pricing logic apply unchanged
  - Guest customers are stored as shadow `CUSTOMER` users keyed by normalized phone

### 14. Domain Management UI
- **`apps/vendor/app/vendor/settings/domains/page.tsx`** — standalone settings page
- **`VendorDomainsCard`** embedded in the main `Settings` tab of the vendor dashboard
- DNS instructions card (TXT host + value, CNAME host + target)
- One-click "Verify" with rate-limit protection
- Subscription status badge (plan + entitlements)

### 15. WhatsApp Messaging Strategy
- **Default platform WhatsApp channel**
  - AlBaz-owned WhatsApp API used for MVP/onboarding
  - Sends order alerts and operational notifications without vendor setup friction
  - Best default for small vendors and pilots

- **Optional vendor-owned WhatsApp API**
  - Paid-plan upgrade for serious vendors who want their own WhatsApp Business number
  - Better brand trust: customers see the vendor's name/number instead of the platform number
  - Vendor owns customer conversation history, templates, limits, and opt-ins
  - Recommended path: Meta Embedded Signup rather than manual token paste

- **Hybrid operating model**
  - `PLATFORM` mode for default notifications through AlBaz
  - `VENDOR_OWNED` mode for branded customer messaging, automation, templates, and two-way support
  - Keeps onboarding simple while preserving a scalable long-term architecture

---

## Component Structure

### Main Components

#### 1. POSView (`components/POSView.tsx`)
- Main POS interface
- Product grid display
- Cart management
- Search and barcode scanning
- Order summary panel
- Custom item dialog

#### 2. InvoiceView (`components/InvoiceView.tsx`)
- Invoice template matching professional format
- A4 format optimization
- PDF export functionality
- Print dialog integration
- Order barcode generation

#### 3. DashboardTab (`components/tabs/DashboardTab.tsx`)
- Sales metrics display
- Top products
- Low stock alerts
- Staff management section
- Quick actions

#### 4. InventoryTab (`components/tabs/InventoryTab.tsx`)
- Product listing
- Product management
- Category filtering
- Stock management

#### 5. SalesTab (`components/tabs/SalesTab.tsx`)
- Sales history table
- Invoice generation
- Sales filtering

#### 6. SettingsTab (`components/tabs/SettingsTab.tsx`)
- Shop information
- Operating hours (Horaires & Capacité)
- Receipt settings
- Appearance settings

### Dialog Components

1. **ProductDialog**: Add/Edit products
2. **CustomerDialog**: Add/Edit customers
3. **SupplierDialog**: Add/Edit suppliers
4. **StaffDialog**: Add/Edit staff members
5. **SaleSuccessDialog**: Sale completion confirmation
6. **ReceiptDialog**: Receipt display
7. **ImageUploadDialog**: Image upload functionality
8. **BarcodeScannerDialog**: Barcode scanning interface

### Storefront / Domain Components

1. **`components/security/VendorDomainsCard.tsx`** — vendor-side card to view/set `vendorSubdomain` and `vendorCustomDomain`, render DNS instructions, and trigger verification.
2. **`app/vendor/settings/domains/page.tsx`** — standalone settings page that hosts `VendorDomainsCard`.

The public storefront itself lives in the **root Next.js app** (the one that handles customer-facing traffic), not under `apps/vendor`:

- `app/s/[vendorSlug]/{layout, page, products/[productId], cart, checkout, orders/[id]}` — App Router storefront tree.
- `app/s/[vendorSlug]/_storefront/{StorefrontHeader, StorefrontFooter, StorefrontCartProvider, ProductCard}.tsx` — UI primitives.
- `app/api/public/storefront/{[vendorSlug]/{profile,catalog,products/[productId]}, orders, orders/[id]}/route.ts` — public, CSRF-protected APIs.

This split keeps the desktop POS / Electron bundle in `apps/vendor` lean while routing all customer storefront traffic through the main deployment.

---

## Key Functionalities

### 1. Offline Mode (Electron)
- **Offline Database**: SQLite-based offline storage
- **Sync Service**: Automatic synchronization when online
- **Queue Management**: Offline sales queuing
- **Background Sync**: Periodic synchronization

### 2. Barcode Scanning
- Hardware barcode scanner support
- Software barcode input
- Product lookup by barcode

### 3. Multi-language Support
- French interface
- Arabic interface (RTL support)
- Language switching

### 4. Custom Items
- Add non-inventory items to cart
- Manual price entry
- Custom item naming

### 5. Discount System
- Fixed amount discount
- Percentage discount
- Discount application to cart

### 6. Receipt & Invoice System
- Receipt generation
- Invoice generation (A4 format)
- PDF export
- Print functionality
- Order barcode on receipts

### 7. Real-time Updates
- Live inventory updates
- Real-time sales tracking
- Dynamic dashboard metrics

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.5.7 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library (Radix UI based)
- **State Management**: React Hooks (useState, useCallback, useMemo)

### Backend Integration
- **API Routes**: Next.js API routes
- **Authentication**: NextAuth.js
- **Data Fetching**: Fetch API with error handling

### Desktop (Electron)
- **Electron**: Desktop application wrapper
- **Offline DB**: SQLite via custom service
- **IPC Communication**: Electron IPC for window communication

### Development Tools
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Build Tool**: Next.js/Webpack

---

## Data Management

### Local Storage
- Shop information
- Staff members
- Operating hours
- Offline sales queue (web version)

### API Endpoints

**ERP / vendor-internal:**
- `/api/erp/inventory` - Inventory management
- `/api/erp/sales` - Sales operations
- `/api/erp/customers` - Customer management
- `/api/erp/suppliers` - Supplier management
- `/api/erp/dashboard` - Dashboard data
- `/api/erp/categories` - Category management
- `/api/vendors/orders` - Order management
- `/api/erp/ai-insights` - AI insights

**Domain management (vendor-authenticated):**
- `GET /api/vendor/domains` - Read current vendor domain config + entitlements
- `POST /api/vendor/domains` - Set/clear `vendorSubdomain` and `vendorCustomDomain`
- `POST /api/vendor/domains/verify` - Run DNS TXT/CNAME verification + Vercel attach
- `GET /api/stores/:id/domains` - Read store-level domain config
- `POST /api/stores/:id/domains` - Set/clear store `subdomain`/`customDomain`
- `POST /api/stores/:id/domains/verify` - Verify store custom domain
- All routes are mirrored under `apps/vendor/app/api/...` for the desktop bundle

**Public storefront (unauthenticated, CSRF-protected mutations):**
- `GET /api/public/storefront/[vendorSlug]/profile` - Vendor branding + active stores
- `GET /api/public/storefront/[vendorSlug]/catalog` - Products grouped by store
- `GET /api/public/storefront/[vendorSlug]/products/[productId]` - Product detail
- `POST /api/public/storefront/orders` - Create a guest order, returns `{orderId, token}`
- `GET /api/public/storefront/orders/[id]?token=...` - Fetch order for confirmation page

### Data Flow
1. **Product Operations**: API → Local State → UI Update
2. **Sales Operations**: Local Cart → API → Receipt/Invoice
3. **Offline Mode**: Local Queue → Sync Service → API
4. **Dashboard Data**: API → Cached State → UI Display

---

## Offline Support

### Electron Offline Mode
- **SQLite Database**: Local database for offline operations
- **Queue System**: Sales queued when offline
- **Auto-sync**: Automatic sync when connection restored
- **Sync Service**: Background service for data synchronization

### Web Offline Mode
- **localStorage Queue**: Offline sales stored in localStorage
- **Sync on Online**: Automatic sync when browser detects online status
- **Manual Sync**: Sync button for manual synchronization

### Sync Mechanism
1. Detect offline status
2. Queue operations
3. Monitor online status
4. Automatic sync when online
5. Success notification

---

## API Integration

### Authentication
- NextAuth.js integration
- Session management
- Role-based access
- Electron-specific authentication

### Data Fetching Patterns
- **useDashboardData Hook**: Centralized data fetching
- **Refresh Functions**: Manual data refresh
- **Error Handling**: Comprehensive error handling
- **Loading States**: Loading indicators

### API Response Handling
- Success/Error responses
- Toast notifications
- Error boundaries
- Retry mechanisms

---

## User Interface

### Design System
- **Color Scheme**: Green/Teal primary colors
- **Dark Mode**: Full dark mode support
- **RTL Support**: Arabic RTL layout
- **Responsive**: Mobile-first design

### Key UI Elements
- **Sidebar Navigation**: Tab-based navigation
- **Cards**: Information display cards
- **Tables**: Data tables with sorting/filtering
- **Dialogs**: Modal dialogs for forms
- **Buttons**: Consistent button styling
- **Inputs**: Form inputs with validation

### Layout Structure
```
┌─────────────────────────────────────┐
│  Header (Logo, User, Notifications) │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │  Main Content Area       │
│ (Tabs)   │  (Dynamic Content)       │
│          │                          │
│          │  ┌────────────────────┐  │
│          │  │  Tab Content      │  │
│          │  │  (POS/Inventory/  │  │
│          │  │   Sales/etc)      │  │
│          │  └────────────────────┘  │
└──────────┴──────────────────────────┘
```

---

## Security & Authentication

### Authentication Methods
- **Web**: NextAuth.js session-based
- **Electron**: Custom Electron auth window
- **Role-based**: Vendor/Admin role support

### Data Security
- **Password Management**: Secure password storage for staff
- **Session Management**: Secure session handling
- **API Security**: Authenticated API requests

### Access Control
- **Staff Roles**: Owner, Manager, Cashier, Staff
- **Permissions**: Role-based feature access
- **Admin Mode**: Admin vendor selector

---

## Recent Updates & Enhancements

### Latest Features (April 2026)

1. **Vendor Storefronts (take.app-style)**
   - Branded public ordering site at `<slug>.albazdelivery.com` for every vendor
   - Optional custom domain (`shop.yourbrand.com`) with DNS-based ownership verification (TXT + CNAME)
   - Subscription-gated: STARTER blocked from custom domains; PROFESSIONAL+ allowed (vendor + N stores by plan)
   - Auto-provisioning to Vercel project on successful verification (`lib/domains/vercel-provisioning.ts`) so SSL is issued automatically
   - Edge-safe middleware rewrites `<slug>.albazdelivery.com/path` → `/s/<slug>/path` and custom-domain hosts → `/s/__host__/path` (resolved server-side via `x-tenant-host` header)
   - Full storefront tree under `app/s/[vendorSlug]/{layout, page, products/[id], cart, checkout, orders/[id]}` with branded layout, persistent localStorage cart, and guest checkout
   - Guest orders flow through the existing `createOrderInternal` pipeline, reusing WhatsApp vendor notifications and loyalty accrual
   - Vendor UI: `VendorDomainsCard` embedded in the Settings tab + standalone `app/vendor/settings/domains` page
   - Demo vendor seeded with `vendorSubdomain='demo'` for local testing
   - Test coverage: 11 middleware host-rewrite tests + 10 public storefront API tests

2. **WhatsApp API operating model**
   - Recommended hybrid model: AlBaz shared WhatsApp API by default, vendor-owned WhatsApp Business API as an optional upgrade
   - Platform mode keeps onboarding simple and lets new vendors receive storefront/customer-app order alerts immediately
   - Vendor-owned mode supports branded sender identity, vendor templates, two-way customer conversations, and better isolation of Meta quality/limit issues
   - Future data model should store encrypted vendor credentials and provider identifiers (`wabaId`, `phoneNumberId`, access token, webhook token) only for vendors using `VENDOR_OWNED` mode
   - Meta Embedded Signup is preferred over manual token entry for production

### Previous Features (December 2024)

1. **Invoice System**
   - Professional invoice template
   - A4 format printing
   - PDF export capability
   - System printer selection
   - Order barcode on invoices

2. **Staff Management**
   - Add/Edit/Delete staff
   - Role assignment
   - Password management
   - Dashboard integration

3. **Operating Hours**
   - Day-wise schedule configuration
   - Opening/closing hours
   - Weekend support (Friday & Saturday)
   - Toggle open/closed status

4. **POS Improvements**
   - Custom item addition
   - Manual price override
   - Removed tax calculations
   - Improved cart UI
   - Numeric keypad in custom items dialog

5. **Print Enhancements**
   - A4 format optimization
   - System printer dialog
   - Print preview
   - PDF generation

---

## Public Storefront (Vendor Subdomains & Custom Domains)

### Goals

Give every vendor a branded public ordering page (think *take.app*) that:

- Lives on a free `<slug>.albazdelivery.com` subdomain by default.
- Can be upgraded to a paid custom domain (`shop.yourbrand.com`) on PROFESSIONAL+.
- Offers a complete catalog → cart → guest checkout → confirmation flow.
- Funnels orders into the **same** `Order` model + WhatsApp vendor notifications used by the customer app and WhatsApp Flow — no parallel pipelines, no duplicate logic.

### Request flow

```
Customer browser
  → middleware.ts (Edge-safe; extracts host, sets x-tenant-host, rewrites URL)
  → app/s/[vendorSlug]/* (App Router storefront pages on Node.js)
  → /api/public/storefront/* (resolves vendor → catalog/orders)
  → prisma → DB
  → createOrderInternal → existing Order pipeline + WhatsApp notify
```

### Tenant resolution precedence

`lib/domains/resolve-host.ts` resolves an incoming host with the following order, mirroring take.app:

1. Store-level **custom domain**
2. Vendor-level **custom domain**
3. Store-level **subdomain**
4. Vendor-level **subdomain**

Custom-domain hosts arrive at `/s/__host__/...` via middleware (a sentinel slug); the storefront layout then re-resolves the real vendor server-side from the `x-tenant-host` header.

### Schema additions

`User` (vendor):
- `vendorSubdomain` (unique, normalized, reserved-label list enforced)
- `vendorCustomDomain` (unique, normalized FQDN)
- `vendorDomainStatus`: `PENDING | VERIFIED | FAILED`
- `vendorDomainVerificationToken`, `vendorDomainVerifiedAt`
- Storefront branding: `storefrontLogoUrl`, `storefrontHeroUrl`, `storefrontTagline`, `storefrontAccentColor`, `storefrontWhatsappPhone`

`Store`:
- `subdomain`, `customDomain` (unique each)
- `domainStatus`, `domainVerificationToken`, `domainVerifiedAt`

### Subscription entitlements

Implemented in `lib/subscriptions/domain-entitlements.ts`:

| Plan          | Vendor custom domain | Store custom domains | Domain writes |
|---------------|----------------------|----------------------|---------------|
| STARTER       | Blocked              | 0                    | Allowed if `ACTIVE`/`TRIAL` |
| PROFESSIONAL  | 1                    | 1                    | Allowed if `ACTIVE`/`TRIAL` |
| BUSINESS      | 1                    | 5                    | Allowed if `ACTIVE`/`TRIAL` |
| ENTERPRISE    | 1                    | unlimited            | Allowed if `ACTIVE`/`TRIAL` |

`PAST_DUE`, `CANCELED`, `EXPIRED` block all domain writes and verifications.

### DNS verification

`lib/domains/verification.ts` implements:

- TXT record check at `_albaz-verify.<domain>` containing the per-vendor token.
- CNAME check pointing `<domain>` at `CUSTOM_DOMAIN_CNAME_TARGET` (default `cname.vercel-dns.com`).
- Both must pass to mark the domain `VERIFIED`.

### Vercel provisioning

`lib/domains/vercel-provisioning.ts` calls the Vercel Domains REST API:

- `POST /v10/projects/{projectId}/domains` on successful verification → SSL auto-issued.
- `DELETE /v9/projects/{projectId}/domains/{domain}` when a custom domain is removed/changed.
- No-op when `VERCEL_API_TOKEN` / `VERCEL_PROJECT_ID` are absent (local dev).
- Idempotent: `409 already exists` on add and `404` on delete are treated as success.

### Guest checkout

`lib/storefront/ensure-guest-customer.ts` finds-or-creates a shadow `CUSTOMER` user keyed by normalized phone (Algerian number variants supported), with a synthetic email and hashed random password — same shape used by the WhatsApp pipeline. The returned customer is then passed to `createOrderInternal`, which:

- Recomputes pricing from `Product` rows (no client-supplied prices trusted)
- Creates the `Order` and `OrderItem` rows
- Triggers the existing WhatsApp vendor notification
- Awards loyalty points
- Returns the persisted order

The storefront API then signs an HMAC token (`signOrderToken` in `lib/storefront/orders.ts`) so the unauthenticated confirmation page can fetch its order without enumeration risk.

### Reserved subdomains

`lib/domains/utils.ts` blocks any subdomain that conflicts with platform routes/services: `www, api, admin, app, vendor(s), driver(s), customer(s), auth, login, signup, register, signin, logout, storefront, cdn, static, assets, images, docs, help, status, billing, dashboard, pos, store(s), health, ws, webhooks, mail, smtp, pop, imap, support, localhost`.

### Required environment variables

- `BASE_DOMAIN` — apex used for vendor subdomains (e.g. `albazdelivery.com`)
- `CUSTOM_DOMAIN_CNAME_TARGET` — value shown in DNS instructions (default `cname.vercel-dns.com`)
- `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID` — for production custom-domain auto-provisioning
- `VERCEL_TEAM_ID` — only when the project is owned by a Vercel team
- `AUTH_SECRET` — used to sign storefront order tokens (already used for NextAuth)

### Local testing

Three options (full details in `docs/CUSTOM_DOMAINS_README.md`):

1. **`*.localhost`** — set `BASE_DOMAIN=localhost`, run `npm run dev`, visit `http://demo.localhost:3000/`.
2. **Hosts-file apex** — add `127.0.0.1 albazdelivery.local` and `127.0.0.1 demo.albazdelivery.local`, set `BASE_DOMAIN=albazdelivery.local`.
3. **Manual `Host` header** via curl/Postman.

Run `npx prisma db seed` to provision the demo vendor at `demo.<BASE_DOMAIN>`.

---

## WhatsApp API Strategy

### Recommendation

Use a **hybrid WhatsApp model**:

- **Default:** one AlBaz-owned WhatsApp Business API channel for order alerts and platform messages.
- **Upgrade:** vendor-owned WhatsApp Business API for vendors who need branded customer conversations, custom templates, automation, or higher isolation.

This keeps onboarding fast for small vendors while leaving a clean path for professional restaurants and high-volume stores.

### Why not only one shared WhatsApp API?

One shared AlBaz number is the fastest MVP path, but it should not be the only long-term model:

- All customers see the platform identity instead of the vendor's brand.
- Vendor replies require routing logic or support handoff.
- Message limits and quality-rating problems are shared across all vendors.
- If Meta restricts the shared number, every vendor is impacted.
- Vendor-specific marketing templates, opt-ins, and customer-history ownership become harder to manage.

### Why not force every vendor to bring their own API?

Forcing vendor-owned WhatsApp API on day one creates unnecessary friction:

- Meta Business setup and verification can be confusing for small shops.
- Each vendor needs a WhatsApp Business Account, phone number, templates, and webhook routing.
- Support burden increases during onboarding.
- Many vendors only need reliable order alerts, not a full conversation platform.

### Operating modes

| Mode | Owner | Best for | Pros | Trade-offs |
|------|-------|----------|------|------------|
| `PLATFORM` | AlBaz | MVP, small vendors, basic order alerts | Fast onboarding, one integration to operate, lower setup friction | Shared limits/quality, platform sender identity |
| `VENDOR_OWNED` | Vendor | Restaurants, brands, high-volume vendors | Vendor brand identity, own templates, own conversations, better isolation | Requires Meta setup, credential storage, onboarding support |

### Suggested data model

Vendor WhatsApp settings should stay nullable until a vendor chooses `VENDOR_OWNED` mode:

```ts
whatsappMode: 'PLATFORM' | 'VENDOR_OWNED'
whatsappPhoneNumberId?: string
whatsappBusinessAccountId?: string
whatsappAccessTokenEncrypted?: string
whatsappWebhookVerifyToken?: string
whatsappTemplatesSyncedAt?: Date
```

Sensitive values must be encrypted at rest. Production onboarding should use **Meta Embedded Signup** so vendors connect their WhatsApp Business account through a guided flow instead of pasting long-lived tokens into the dashboard.

### Rollout plan

1. Keep AlBaz shared WhatsApp API as the default order-notification channel.
2. Add vendor settings for preferred notification number and storefront contact number.
3. Add `VENDOR_OWNED` WhatsApp API as a paid-plan capability (recommended: BUSINESS / ENTERPRISE).
4. Add Meta Embedded Signup and webhook routing by `phone_number_id`.
5. Add template management, customer opt-in tracking, and vendor conversation inbox only after the domain/storefront flow is stable.

---

## Restaurant Version Analysis

Restaurants need a stricter, faster workflow than general retail. The restaurant version should be a specialized configuration of the same vendor app, not a separate app. It should reuse authentication, POS, inventory, storefront, WhatsApp, orders, and reporting, while changing the UI defaults and data model around menus, tables, kitchen flow, and delivery timing.

For the complete restaurant-specific product and technical analysis, see:

- `apps/vendor/docs/VENDOR_APP_RESTAURANT_VERSION_ANALYSIS.md`

### Restaurant-specific priorities

1. **Fast order capture** — waiter/cashier can build an order quickly by category, modifier, and table.
2. **Menu management** — dishes, variants, add-ons, availability, prep time, allergens, and scheduled menus.
3. **Kitchen operations** — Kitchen Display System (KDS), ticket status, prep timers, and station routing.
4. **Dining modes** — dine-in, takeaway, delivery, curbside, and storefront orders in one order book.
5. **Table management** — floor plan, table status, split/merge bills, waiter assignment.
6. **WhatsApp + storefront** — customer ordering, order confirmations, and optional vendor-owned WhatsApp for branded conversations.
7. **Restaurant reporting** — item mix, peak hours, prep-time SLA, cancellation/refund reasons, table turnover, delivery performance.

### Recommended approach

- Add a `shopType = 'Restaurant'` feature profile that turns on restaurant-specific tabs and language.
- Preserve the existing POS for retail/vendor use, but add restaurant mode UI (`Menu`, `Tables`, `Kitchen`, `Orders`, `Delivery`, `Reports`).
- Reuse the public storefront already built under `app/s/[vendorSlug]`, but present menu categories, modifiers, and pickup/delivery slots for restaurant vendors.
- Keep WhatsApp platform mode as default, then offer vendor-owned WhatsApp API for restaurant brands that need their own number.

---

## File Organization

### Components
- **Main Views**: POSView, InvoiceView, ReceiptView
- **Tabs**: DashboardTab, InventoryTab, SalesTab, SettingsTab, etc.
- **Dialogs**: ProductDialog, CustomerDialog, StaffDialog, etc.
- **Utilities**: AdminVendorSelector, LoadingScreen, ErrorBoundary

### Hooks
- `usePOSCart`: Cart state management
- `usePOSHandlers`: POS event handlers
- `useBarcodeScanner`: Barcode scanning
- `useDataLoading`: Data loading states
- `useVendorState`: Vendor state management

### Utils
- `productUtils`: Product operations
- `saleUtils`: Sales operations
- `customerUtils`: Customer operations
- `orderUtils`: Order operations
- `electronUtils`: Electron-specific utilities
- `errorHandling`: Error handling utilities

---

## Testing

### Test Coverage
- Component tests in `__tests__/components/`
- Hook tests in `__tests__/hooks/`
- Utility tests in `__tests__/utils/`
- Regression tests: `vendor-dashboard.regression.test.tsx`

### Test Files
- `usePOSCart.test.tsx`
- `usePOSHandlers.test.tsx`
- `aiUtils.test.ts`
- `customerUtils.test.ts`
- `saleUtils.test.ts`
- And more...

---

## Performance Optimizations

1. **Memoization**: useMemo for expensive calculations
2. **Callback Optimization**: useCallback for event handlers
3. **Lazy Loading**: Dynamic imports where appropriate
4. **State Management**: Efficient state updates
5. **API Caching**: Cached dashboard data
6. **Debouncing**: Search input debouncing

---

## Known Limitations

### Current Technical Limitations

1. **Offline Sync Scope**
   - **Limitation**: Currently limited to sales operations in offline mode
   - **Impact**: Inventory updates, customer management, and other operations require online connection
   - **Workaround**: Users must ensure internet connectivity for full functionality
   - **Future Enhancement**: Expand offline capabilities to include inventory updates and customer management

2. **Image Upload Dependency**
   - **Limitation**: Image uploads (product images, logos, cover photos) require active internet connection
   - **Impact**: Cannot add product images or update shop visuals while offline
   - **Workaround**: Queue image uploads for when connection is restored
   - **Future Enhancement**: Implement local image caching and deferred upload queue

3. **AI Insights Dependency**
   - **Limitation**: AI-powered insights and analytics require API connectivity
   - **Impact**: Business intelligence features unavailable in offline mode
   - **Workaround**: Cached insights available, but no real-time analysis
   - **Future Enhancement**: Implement local ML models for basic insights

4. **Multi-vendor Access**
   - **Limitation**: Admin mode required for multi-vendor access
   - **Impact**: Regular vendors cannot switch between multiple vendor accounts
   - **Workaround**: Admin users can manage multiple vendors
   - **Future Enhancement**: Allow vendor account switching with proper permissions

5. **Browser Compatibility**
   - **Limitation**: Some features may have limited support in older browsers
   - **Impact**: Users with outdated browsers may experience functionality issues
   - **Workaround**: Use modern browsers (Chrome, Firefox, Edge, Safari latest versions)
   - **Future Enhancement**: Enhanced browser compatibility testing and polyfills

6. **Print Functionality**
   - **Limitation**: Print dialog relies on browser/OS print functionality
   - **Impact**: Printer selection and print settings vary by environment
   - **Workaround**: Use system print dialog for printer selection
   - **Future Enhancement**: Custom print preview and settings interface

7. **Local Storage Constraints**
   - **Limitation**: Web version uses localStorage with size limitations (~5-10MB)
   - **Impact**: Large datasets may cause storage issues
   - **Workaround**: Electron version uses SQLite for larger storage capacity
   - **Future Enhancement**: Implement IndexedDB for web version

8. **Real-time Collaboration**
   - **Limitation**: No real-time multi-user collaboration features
   - **Impact**: Multiple staff members cannot simultaneously edit inventory or sales
   - **Workaround**: Sequential access or role-based restrictions
   - **Future Enhancement**: WebSocket-based real-time sync and conflict resolution

9. **Data Export Limitations**
   - **Limitation**: Limited export formats (PDF for invoices/receipts)
   - **Impact**: Bulk data export may require manual processes
   - **Workaround**: Use API endpoints for data extraction
   - **Future Enhancement**: CSV/Excel export for reports and data analysis

10. **Search Performance**
    - **Limitation**: Large inventory catalogs may experience slower search performance
    - **Impact**: Search responsiveness decreases with very large product databases
    - **Workaround**: Use category filtering to narrow search scope
    - **Future Enhancement**: Implement search indexing and debounced search optimization

### Functional Limitations

11. **Tax System**
    - **Limitation**: Tax calculations removed from current implementation
    - **Impact**: Manual tax calculation required if needed
    - **Workaround**: Manual total override feature available
    - **Note**: This was a design decision, not a technical limitation

12. **Receipt Customization**
    - **Limitation**: Limited receipt template customization options
    - **Impact**: Fixed receipt format with minimal customization
    - **Workaround**: Basic shop information and logo can be customized
    - **Future Enhancement**: Template editor for receipts and invoices

13. **Notification System**
    - **Limitation**: No push notifications or real-time alerts
    - **Impact**: Users must manually check for updates
    - **Workaround**: Dashboard shows real-time metrics when page is active
    - **Future Enhancement**: Browser push notifications for important events

14. **Backup & Recovery**
    - **Limitation**: No automated backup system
    - **Impact**: Data loss risk if local storage is cleared
    - **Workaround**: Regular API sync serves as backup
    - **Future Enhancement**: Automated backup and restore functionality

---

## Future Enhancements (Potential)

This section outlines potential features and improvements that could enhance the Vendor App's functionality, user experience, and business value. Each enhancement includes detailed explanations, implementation considerations, and expected benefits.

---

### 1. Advanced Reporting & Analytics

**Description**: Comprehensive reporting system with detailed sales analytics, trends, and business insights.

**Features**:
- **Sales Reports**: Daily, weekly, monthly, and custom date range reports
- **Product Performance**: Best/worst selling products, profit margins, turnover rates
- **Customer Analytics**: Customer purchase patterns, lifetime value, frequency analysis
- **Financial Reports**: Revenue trends, profit/loss statements, tax summaries
- **Comparative Analysis**: Year-over-year, period-over-period comparisons
- **Visual Dashboards**: Charts, graphs, and visual representations of data
- **Export Options**: PDF, Excel, CSV export formats
- **Scheduled Reports**: Automated report generation and delivery

**Implementation Approach**:
- Create dedicated reporting API endpoints
- Implement data aggregation and analysis algorithms
- Use charting libraries (Chart.js, Recharts, D3.js)
- Build report templates and generators
- Add filtering and sorting capabilities

**Benefits**:
- Data-driven business decisions
- Better inventory management
- Customer behavior insights
- Financial planning and forecasting
- Performance tracking

**Priority**: High | **Complexity**: Medium-High | **Estimated Impact**: High

---

### 2. Multi-currency Support

**Description**: Support for multiple currencies to enable international operations and multi-market vendors.

**Features**:
- **Currency Selection**: Choose primary and secondary currencies
- **Exchange Rate Management**: Real-time or manual exchange rate updates
- **Multi-currency Pricing**: Set prices in different currencies
- **Currency Conversion**: Automatic conversion at point of sale
- **Currency Display**: Show prices in selected currency
- **Exchange Rate History**: Track exchange rate changes over time
- **Currency Reports**: Financial reports in multiple currencies

**Implementation Approach**:
- Add currency field to products and sales
- Integrate currency exchange rate API (e.g., ExchangeRate-API, Fixer.io)
- Update UI to display currency symbols and formatting
- Modify calculations to handle currency conversion
- Store exchange rates with timestamps

**Benefits**:
- International market expansion
- Flexible pricing strategies
- Better financial tracking
- Customer convenience

**Priority**: Medium | **Complexity**: Medium | **Estimated Impact**: Medium-High

---

### 3. Loyalty Program

**Description**: Customer loyalty points and rewards system to encourage repeat business and customer retention.

**Features**:
- **Points System**: Earn points on purchases (configurable rate)
- **Rewards Tiers**: Bronze, Silver, Gold membership levels
- **Point Redemption**: Customers can redeem points for discounts or products
- **Loyalty Cards**: Digital or physical loyalty cards
- **Promotional Campaigns**: Special offers for loyalty members
- **Points History**: Track points earned and redeemed
- **Referral Program**: Bonus points for customer referrals
- **Birthday Rewards**: Special offers on customer birthdays

**Implementation Approach**:
- Add loyalty points field to customer records
- Create points calculation engine
- Build redemption system
- Design loyalty card interface
- Implement campaign management
- Add points transaction history

**Benefits**:
- Increased customer retention
- Higher customer lifetime value
- Competitive advantage
- Customer engagement
- Data collection for marketing

**Priority**: Medium | **Complexity**: Medium | **Estimated Impact**: High

---

### 4. Advanced Discounts & Promotions

**Description**: Comprehensive discount and promotion management system with coupon codes, seasonal sales, and promotional campaigns.

**Features**:
- **Coupon Codes**: Generate and manage discount codes
- **Percentage Discounts**: Configurable percentage-based discounts
- **Fixed Amount Discounts**: Set dollar/currency amount discounts
- **Buy X Get Y**: Buy-one-get-one and similar promotions
- **Seasonal Sales**: Time-limited promotional campaigns
- **Bulk Discounts**: Quantity-based pricing tiers
- **Customer-Specific Discounts**: Personalized offers
- **Discount Analytics**: Track discount usage and effectiveness
- **Minimum Purchase Requirements**: Set thresholds for discounts
- **Stackable Discounts**: Allow multiple discounts (with rules)

**Implementation Approach**:
- Create discount/coupon data model
- Build coupon code generator
- Implement discount calculation engine
- Add discount validation logic
- Create promotion management interface
- Add discount tracking and analytics

**Benefits**:
- Increased sales volume
- Customer acquisition
- Inventory clearance
- Marketing tool
- Competitive pricing

**Priority**: High | **Complexity**: Medium | **Estimated Impact**: High

---

### 5. Email Integration

**Description**: Email functionality for sending receipts, invoices, promotional emails, and notifications.

**Features**:
- **Email Receipts**: Automatic email receipts after purchase
- **Invoice Delivery**: Email invoices to customers
- **Promotional Emails**: Marketing campaigns and newsletters
- **Order Notifications**: Order status updates via email
- **Low Stock Alerts**: Email notifications for inventory alerts
- **Customizable Templates**: Email template editor
- **Email Scheduling**: Schedule emails for specific times
- **Email Analytics**: Open rates, click rates, delivery status
- **Bulk Email**: Send to customer segments

**Implementation Approach**:
- Integrate email service (SendGrid, Mailgun, AWS SES)
- Create email template system
- Build email queue for reliable delivery
- Implement email tracking
- Add unsubscribe functionality
- Design email template editor

**Benefits**:
- Paperless receipts
- Customer communication
- Marketing channel
- Professional image
- Cost savings

**Priority**: Medium | **Complexity**: Medium | **Estimated Impact**: Medium-High

---

### 6. Mobile App (Native)

**Description**: Native mobile applications for iOS and Android to provide on-the-go access to POS and management features.

**Features**:
- **Mobile POS**: Full POS functionality on mobile devices
- **Inventory Management**: View and update inventory from mobile
- **Sales Tracking**: Monitor sales in real-time
- **Customer Management**: Access customer database
- **Receipt Scanning**: Scan receipts for returns/refunds
- **Push Notifications**: Real-time alerts and notifications
- **Offline Mode**: Full offline functionality
- **Mobile Payments**: Integration with mobile payment systems
- **Camera Integration**: Product photo capture
- **Location Services**: Store location tracking

**Implementation Approach**:
- Use React Native or Flutter for cross-platform development
- Reuse business logic from web app
- Implement native device features
- Design mobile-optimized UI/UX
- Add offline data synchronization
- Integrate mobile payment SDKs

**Benefits**:
- Increased accessibility
- Mobile-first experience
- On-the-go operations
- Better customer service
- Competitive advantage

**Priority**: Medium | **Complexity**: High | **Estimated Impact**: High

---

### 7. Cloud Sync & Multi-device Support

**Description**: Cloud-based data synchronization enabling seamless multi-device access and real-time data consistency.

**Features**:
- **Real-time Sync**: Instant synchronization across devices
- **Conflict Resolution**: Automatic conflict resolution strategies
- **Multi-device Access**: Access from any device, anywhere
- **Data Backup**: Automatic cloud backup
- **Version History**: Track changes and restore previous versions
- **Offline-first Architecture**: Work offline, sync when online
- **Selective Sync**: Choose what data to sync
- **Sync Status Indicators**: Visual sync status and progress
- **Bandwidth Optimization**: Efficient data transfer

**Implementation Approach**:
- Implement WebSocket or Server-Sent Events for real-time updates
- Use cloud database (Firebase, AWS, Azure)
- Create sync service layer
- Implement conflict resolution algorithms
- Add sync status tracking
- Optimize data transfer protocols

**Benefits**:
- Data accessibility
- Data safety
- Multi-location support
- Real-time collaboration
- Scalability

**Priority**: High | **Complexity**: High | **Estimated Impact**: Very High

---

### 8. Advanced Permissions & Role Management

**Description**: Granular permission system with role-based access control (RBAC) for fine-tuned security and access management.

**Features**:
- **Custom Roles**: Create custom roles with specific permissions
- **Permission Granularity**: Fine-grained permissions (view, create, edit, delete)
- **Module-level Permissions**: Control access to specific modules
- **Feature-level Permissions**: Control access to specific features
- **Time-based Access**: Schedule access times for staff
- **IP Restrictions**: Restrict access from specific IP addresses
- **Audit Logging**: Track all permission-related actions
- **Role Templates**: Pre-defined role templates
- **Permission Inheritance**: Hierarchical permission structure
- **Multi-factor Authentication**: Enhanced security for sensitive operations

**Implementation Approach**:
- Design permission data model
- Create role management interface
- Implement permission checking middleware
- Build permission assignment UI
- Add audit logging system
- Integrate MFA solutions

**Benefits**:
- Enhanced security
- Compliance support
- Flexible access control
- Accountability
- Reduced risk

**Priority**: Medium-High | **Complexity**: Medium | **Estimated Impact**: High

---

### 9. Advanced Inventory Alerts

**Description**: Comprehensive inventory alert system with multiple notification channels and intelligent alerting rules.

**Features**:
- **Low Stock Alerts**: Configurable thresholds for stock levels
- **Out of Stock Notifications**: Immediate alerts when items are out of stock
- **Expiry Date Alerts**: Notifications for products nearing expiration
- **Reorder Points**: Automatic reorder suggestions
- **Multi-channel Notifications**: Email, SMS, push notifications, in-app alerts
- **Alert Rules Engine**: Customizable alert rules and conditions
- **Alert Prioritization**: Critical, high, medium, low priority levels
- **Alert History**: Track all alerts and responses
- **Supplier Integration**: Automatic reorder requests to suppliers
- **Predictive Alerts**: AI-powered demand forecasting

**Implementation Approach**:
- Create alert rule engine
- Integrate notification services (SMS, email, push)
- Build alert configuration interface
- Implement alert scheduling
- Add alert analytics
- Integrate with supplier systems

**Benefits**:
- Prevent stockouts
- Better inventory management
- Cost optimization
- Customer satisfaction
- Automated operations

**Priority**: Medium | **Complexity**: Medium | **Estimated Impact**: Medium-High

---

### 10. Backup & Restore System

**Description**: Automated backup and restore functionality to protect business data and enable disaster recovery.

**Features**:
- **Automated Backups**: Scheduled automatic backups
- **Incremental Backups**: Efficient backup storage
- **Multiple Backup Locations**: Local, cloud, and external storage
- **Point-in-time Recovery**: Restore to specific dates/times
- **Selective Restore**: Restore specific data types
- **Backup Verification**: Verify backup integrity
- **Backup Encryption**: Secure backup storage
- **Backup Retention Policies**: Configurable retention periods
- **One-click Restore**: Easy restore process
- **Backup Scheduling**: Flexible backup schedules
- **Backup Notifications**: Alerts for backup status

**Implementation Approach**:
- Create backup service
- Implement data export/import functionality
- Add backup scheduling system
- Integrate cloud storage APIs
- Build restore interface
- Add backup verification checks
- Implement encryption

**Benefits**:
- Data protection
- Disaster recovery
- Business continuity
- Compliance
- Peace of mind

**Priority**: High | **Complexity**: Medium | **Estimated Impact**: High

---

### Additional Enhancement Ideas

11. **Barcode Generation**: Generate custom barcodes for products
12. **QR Code Integration**: QR codes for receipts, products, and promotions
13. **Voice Commands**: Voice-activated POS operations
14. **Touchscreen Optimization**: Enhanced touchscreen interface
15. **Multi-language Receipts**: Receipts in customer's preferred language
16. **Integration APIs**: RESTful APIs for third-party integrations
17. **Webhook Support**: Webhooks for event notifications
18. **Advanced Search**: Full-text search with filters
19. **Product Variants**: Size, color, and other variant management
20. **Bulk Operations**: Bulk import/export, bulk updates
21. **Tax Management**: Comprehensive tax calculation and reporting
22. **Expense Tracking**: Track business expenses
23. **Supplier Integration**: Direct supplier ordering
24. **Customer Communication**: In-app messaging with customers
25. **Social Media Integration**: Share products and promotions

---

### Enhancement Prioritization Framework

When planning implementation, consider:

- **Business Value**: Impact on revenue, customer satisfaction, operational efficiency
- **User Demand**: Frequency of feature requests and user feedback
- **Technical Feasibility**: Complexity, required resources, dependencies
- **Market Competition**: Competitive advantage and market positioning
- **Resource Availability**: Development team capacity and budget
- **Strategic Alignment**: Alignment with business goals and roadmap

**Recommended Implementation Order**:
1. Advanced Reporting (High business value, medium complexity)
2. Advanced Discounts (High impact, medium complexity)
3. Backup & Restore (Critical for data safety)
4. Cloud Sync (Enables other features)
5. Email Integration (Customer communication)
6. Advanced Permissions (Security and compliance)
7. Loyalty Program (Customer retention)
8. Advanced Inventory Alerts (Operational efficiency)
9. Multi-currency (Market expansion)
10. Mobile App (Long-term strategic)

---

## Dependencies

### Key Dependencies
- `next`: ^15.5.7
- `react`: ^18.3.1
- `typescript`: Latest
- `tailwindcss`: Latest
- `lucide-react`: Icons
- `@radix-ui/*`: UI primitives
- `next-auth`: Authentication

### Electron Dependencies
- `electron`: Desktop application
- Custom offline database service
- IPC communication layer

---

## Configuration Files

- `next.config.mjs`: Next.js configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration
- `electron-builder.yml`: Electron build configuration
- `package.json`: Project dependencies and scripts

---

## Documentation

Additional documentation available:
- `ELECTRON_SETUP.md`: Electron setup instructions
- `ERROR_HANDLING.md`: Error handling guidelines
- `TESTING.md`: Testing documentation
- `REFACTORING_PROGRESS.md`: Refactoring progress
- `docs/VENDOR_APP_USER_GUIDE.md`: Pilot user guide for shop owners and staff
- `docs/VENDOR_APP_RESTAURANT_VERSION_ANALYSIS.md`: Restaurant-specific app profile, workflows, data model, and rollout plan

---

## Development Workflow

### Getting Started
1. Install dependencies: `npm install`
2. Set up environment variables
3. Run development server: `npm run dev`
4. For Electron: `npm run electron:dev`

### Building
- Web: `npm run build`
- Electron: `npm run build:electron`

---

## Support & Maintenance

### Error Handling
- Error boundaries for component errors
- Try-catch blocks for API calls
- User-friendly error messages
- Error logging

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Component-based architecture
- Reusable utility functions

---

## Conclusion

The Vendor App is a comprehensive POS and business management system with robust offline capabilities, modern UI/UX, and extensive features for managing all aspects of a vendor's business operations. The application supports both web and desktop environments, making it versatile for different deployment scenarios.

As of April 2026 it also fronts a **public, branded vendor storefront** (vendor subdomains + custom domains), turning every vendor into their own ordering site without leaving the AlBaz platform. Storefront orders flow through the same `Order` / WhatsApp / loyalty pipeline as the rest of the platform, so vendors get a unified order book regardless of channel (POS, customer app, WhatsApp Flow, public storefront).

**Status**: Production Ready
**Version**: Latest (April 2026)
**Maintainer**: Development Team

---

*This document is automatically generated and should be updated regularly as new features are added.*

