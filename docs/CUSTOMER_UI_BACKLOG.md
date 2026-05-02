# Customer app — UI backlog

**Purpose:** Single checklist of customer-facing UI that is shallow, disabled, mock-backed, or inconsistent with the rest of the shell (fr/ar/en). Use this for sprint planning; link PRs to items when closing them.

**Related:** [ENHANCEMENT_PLAN.md](./ENHANCEMENT_PLAN.md) (platform/infrastructure), [NOTIFICATION_CHANNELS.md](./NOTIFICATION_CHANNELS.md).

## Recently implemented (2026-04-28)

- **Notification inbox (customer shell)** — **Commandes → Notifications** tab lists `GET /api/notifications`, **Mark all read**, tap row marks read and opens related order when `relatedOrderId` is set. Home **bell** opens this tab via `ordersEntry`. Bottom **Orders** tab shows **unread badge**. Client **`notificationsAPI`** aligned with server (`PUT` body `notificationId` / `markAllAsRead`, `DELETE ?id=`).
- **`app/error.tsx`** — Trilingual error boundary with **Try again** (`reset`) and **Home** link.
- **Notifications bell (`HomePage`)** — `onOpenNotifications` → **Orders** screen with **Notifications** tab selected (`ordersEntry`).
- **`AppHeader`** — `"use client"`, **`useProfileI18n`** for `aria-label` / logo alt / theme labels; bell calls optional **`onOpenNotifications`**.
- **Store product sheet** — **Favorites** persisted in **`localStorage`** (`lib/favorite-products.ts`); **Share** via **Web Share API** or **clipboard** + toast.
- **`StoreView` + `page.tsx`** — **`vendorProfile`** is passed through (already fetched in `page.tsx`).
- **Home package hub** — Label uses **`t('home-package-hub', …)`** instead of inline language branches.

### Update — profile enums + ErrorBoundary + vendor placeholder

- **`lib/profile-display-labels.ts`** — Maps **support** status/priority, **payment** status/method, **loyalty** tx type + tier via existing **`t()`** / Prisma enums.
- **`ErrorBoundary`** — FR / AR / EN fallback UI from **`html lang`** (aligned with customer `ThemeInitializer` / `applyLanguage`).
- **Vendor `ProductDialog`** — **`placeholder.svg`** fallback (no `.jpg`).

### Favorites, store covers, global-error

- **`PageView` `favorites` + `FavoritesView`** — Lists device-local favorites with **Magasin** (opens store in shell) and remove. **Profile → Mes favoris**. Metadata (`storeId`, `categoryId`, name, price, image, storeName) saved when starring in **`StoreView`**.
- **GET `/api/stores`** — Includes vendor **`storefrontHeroUrl`**, **`storefrontLogoUrl`**, **`photoUrl`**; category cards use first available as **`coverImage`**.
- **`app/global-error.tsx`** — Root-level error UI with **Try again** + **Reload** (trilingual via **`useProfileI18n`**).

---

## 1. Explicitly incomplete or “coming soon”

| Item | Location / notes |
|------|------------------|
| **Credit card in main checkout** | `apps/customer/components/views/CheckoutView.tsx` — option is `disabled` with `t('coming-soon', …)`. Enable when order → Stripe (or other) flow is wired end-to-end from this screen. |
| **Standalone Stripe checkout route** | `apps/customer/app/checkout/page.tsx` + `client.tsx` — exists for PaymentIntent + card; ensure product flow links here when card is enabled, or document deprecation if inline only. |

---

## 2. Controls with no real behavior

| Item | Location / notes |
|------|------------------|
| **Favorite (star) on product detail** | `StoreView` — **Done (device-local):** `lib/favorite-products.ts` + `localStorage`. **Still open:** server sync / “my favorites” screen in app. |
| **Share on product detail** | `StoreView` — **Done:** `navigator.share` or clipboard + toast. |
| **Notifications bell (home)** | **Done:** opens **Orders → Notifications** tab (`ordersEntry` + unread badge on nav). **Still open:** live **SSE** stream inside the inbox (server list is canonical). |
| **Notifications in `AppHeader`** | **Done:** optional `onOpenNotifications`; labels i18n. Caller must pass the handler (same as home). |

---

## 3. Placeholder or mock-backed visuals / data

| Item | Location / notes |
|------|------------------|
| **Store hero image in category list** | **Done (when API provides assets):** vendor **`storefrontHeroUrl`** / logo / `photoUrl` → **`coverImage`** on store rows. |
| **City list** | **Done (shared config):** `apps/customer/lib/cities.ts` (`CUSTOMER_DELIVERY_CITIES` + `cities`); home city **selector** in `HomePage`. Replace with API when coverage zones are dynamic. |
| **Categories source** | `apps/customer/lib/mock-data.ts` + `app/api/categories/**` — categories largely code-defined; full “catalog admin → customer” parity is a larger task. |

---

## 4. i18n / accessibility polish

| Item | Location / notes |
|------|------------------|
| **`AppHeader` strings** | **Largely done** for aria + logo + theme. |
| **Package delivery label on home** | **Done:** `home-package-hub` via `t()`. |
| **Support ticket list** | **Done:** `lib/profile-display-labels.ts` — localized status / priority. |
| **Payments history** | **Done:** localized **`PaymentStatus`** / **`PaymentMethod`**. |
| **Loyalty transactions** | **Done:** **`LoyaltyTransactionType`** + **`MembershipTier`** labels. |
| **Legacy `Header.tsx`** | `apps/customer/components/Header.tsx` — if still referenced, align with `useProfileI18n` / theme hooks like the main shell. |

---

## 5. Error / empty states

| Item | Location / notes |
|------|------------------|
| **Route-level errors** | **`app/error.tsx` added** (trilingual). Optional: `global-error.tsx` for root layout errors. |
| **`ErrorBoundary` copy** | **Done:** `components/ErrorBoundary.tsx` uses **`document.documentElement.lang`** (fr / ar / en) for title, buttons, dev summary. |

---

## 6. Cross-app UI debt (customer-adjacent)

| Item | Location / notes |
|------|------------------|
| **Vendor product image placeholder** | **Done:** `ProductDialog` uses **`/placeholder.svg`** (was `.jpg`). |

---

## Suggested priority (opinionated)

1. **Favorites server sync** — optional backend “my favorites” vs device-only list.  
2. **Store images** — ensure all storefronts expose hero/logo in API.  
3. **Notification stream** — optional SSE panel alongside DB list.  
4. **`global-error.tsx`** + root **`ErrorBoundary`** copy review.  
5. **Card checkout** — blocked on money path (see Enhancement Plan).

---

*Last updated: 2026-04-28 (notification inbox + backlog refresh)*
