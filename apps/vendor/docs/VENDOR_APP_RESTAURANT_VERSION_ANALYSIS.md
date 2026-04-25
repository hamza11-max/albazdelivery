# Vendor App Restaurant Version Analysis

## Overview

The restaurant version of the AlBaz Vendor App is a specialized operating mode for restaurants, cafes, fast-food shops, bakeries, dark kitchens, and small food businesses. It should reuse the existing vendor app foundation — authentication, POS, inventory, sales history, staff, public storefront, WhatsApp notifications, and Electron offline support — while optimizing the workflows around menus, tables, kitchen preparation, delivery timing, and online ordering.

The recommended approach is **one vendor app with a restaurant profile**, not a fully separate product. A vendor with `shopType = Restaurant` should see restaurant-focused labels, tabs, actions, and defaults. Retail vendors continue to use the existing generic POS flow.

**Last Updated:** April 2026

---

## Goals

1. Let restaurants take orders quickly from counter, table, phone, WhatsApp, customer app, and public storefront.
2. Keep one unified order book across dine-in, takeaway, delivery, and online storefront orders.
3. Improve kitchen execution with tickets, preparation status, timers, and clear item notes.
4. Make the public storefront work like a branded online menu and ordering site.
5. Support restaurant-specific reporting: peak hours, prep time, menu performance, cancellation reasons, and table turnover.
6. Preserve the current app investment by layering restaurant features on top of the existing POS and order system.

---

## Restaurant User Types

### Owner / Manager

- Configures menu, prices, opening hours, delivery areas, staff, and storefront.
- Reviews reports and daily totals.
- Manages refunds, discounts, and high-risk actions.
- Configures WhatsApp, domains, and public ordering.

### Cashier

- Takes counter, takeaway, and phone orders.
- Accepts payments.
- Prints receipts and kitchen tickets.
- Updates order status.

### Waiter

- Opens tables and adds items.
- Sends items to kitchen.
- Splits or merges bills.
- Moves tables when needed.

### Kitchen Staff

- Views incoming kitchen tickets.
- Marks items/orders as preparing or ready.
- Sees preparation notes and modifiers.
- Prioritizes urgent delivery/takeaway orders.

### Delivery Coordinator

- Tracks delivery orders.
- Assigns or coordinates drivers.
- Contacts customers if needed.
- Marks orders out for delivery or completed.

---

## Core Restaurant Modules

### 1. Restaurant POS

The restaurant POS should optimize for speed and repeat usage:

- Category-first menu layout: pizzas, sandwiches, grill, drinks, desserts, combos.
- Large touch-friendly menu buttons.
- Quick search for menu items.
- Fast quantity controls.
- Item-level notes: "no onions", "extra sauce", "well done".
- Item modifiers and variants: size, toppings, cooking level, add-ons.
- Order type selector: `DINE_IN`, `TAKEAWAY`, `DELIVERY`, `ONLINE`.
- Kitchen ticket print or Kitchen Display System handoff.

### 2. Menu Management

Restaurant products are not just inventory items. They are customer-facing dishes with availability, prep time, and modifiers.

Recommended fields:

- Name, description, category, image, price.
- Availability: active, sold out, hidden from storefront.
- Preparation time estimate.
- Menu tags: spicy, vegetarian, popular, new, combo.
- Allergens and dietary notes.
- Modifier groups: size, toppings, extras, sauces.
- Scheduled availability: breakfast/lunch/dinner, days of week.

### 3. Table Management

Dine-in restaurants need table state:

- Floor plan or table list.
- Table statuses: free, seated, ordered, preparing, served, paying, closed.
- Waiter assignment.
- Open bill per table.
- Move table.
- Merge tables.
- Split bill by item or amount.
- Print table bill.

This can ship after counter/takeaway flow if the first restaurant pilots are fast-food or delivery-first.

### 4. Kitchen Display / Kitchen Tickets

Kitchen workflows are the biggest difference from retail POS.

Minimum viable kitchen flow:

- Print kitchen ticket after order confirmation.
- Ticket includes order type, table/customer, items, modifiers, notes, timestamp.
- Order status: pending → preparing → ready → completed.
- Separate "ready" action for cashier/waiter.

Future KDS:

- Live screen showing kitchen tickets.
- Prep timers and overdue warnings.
- Station routing: grill, pizza, drinks, dessert.
- Item-level status.
- Sound/visual alerts for new orders.

### 5. Delivery & Takeaway Flow

Restaurant orders often need clear timing:

- Pickup/delivery time.
- Customer phone and address.
- Notes for driver or restaurant.
- Order source: POS, customer app, WhatsApp, storefront.
- Driver assignment or external delivery marker.
- Status: accepted, preparing, ready, out for delivery, delivered, canceled.

The existing `Order` model and vendor order dashboard should stay the primary system of record.

### 6. Public Storefront Menu

The storefront already built under `app/s/[vendorSlug]` becomes the restaurant's public online menu and ordering site.

Restaurant-specific storefront improvements:

- Menu category navigation.
- Dish photos and tags.
- Sold-out item visibility control.
- Modifiers/add-ons on product pages.
- Pickup vs delivery selection.
- Optional scheduled order time.
- Minimum order amount.
- Restaurant opening-hours gate.
- WhatsApp contact button.

### 7. WhatsApp Strategy for Restaurants

Restaurants should start with the default AlBaz platform WhatsApp API for order alerts. It is fast to onboard and works for pilots.

Vendor-owned WhatsApp API becomes important for larger restaurants because:

- Customers trust messages from the restaurant's own number.
- The restaurant can use its own templates and brand name.
- Two-way conversations stay with the restaurant.
- Meta quality score and messaging limits are isolated from other vendors.

Recommended model:

- `PLATFORM` WhatsApp mode for all restaurants by default.
- `VENDOR_OWNED` WhatsApp mode for BUSINESS / ENTERPRISE restaurants.
- Meta Embedded Signup for production onboarding.
- Encrypted storage for vendor credentials.

---

## Data Model Additions

The current platform can support a restaurant MVP using existing `Product`, `Store`, `Order`, `OrderItem`, and `User` models. The following additions would make restaurant workflows stronger.

### Menu Item Extensions

Potential additions to `Product` or a restaurant-specific `MenuItem` profile:

```ts
prepTimeMinutes?: number
isPopular?: boolean
isSpicy?: boolean
isVegetarian?: boolean
allergens?: string[]
availableFrom?: string
availableUntil?: string
availableDays?: string[]
sortOrder?: number
```

### Modifiers

Restaurants need add-ons and variants:

```ts
MenuModifierGroup {
  id: string
  vendorId: string
  name: string
  minSelections: number
  maxSelections: number
  required: boolean
}

MenuModifierOption {
  id: string
  groupId: string
  name: string
  priceDelta: number
  available: boolean
}
```

Examples:

- Size: small, medium, large.
- Toppings: cheese, olives, mushrooms.
- Sauce: harissa, mayo, garlic.
- Cooking: rare, medium, well done.

### Order Item Notes & Modifiers

Each order item should persist selected modifiers and notes:

```ts
OrderItem {
  notes?: string
  modifiersJson?: Json
  kitchenStatus?: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED'
}
```

### Tables

```ts
RestaurantTable {
  id: string
  vendorId: string
  storeId: string
  name: string
  capacity: number
  status: 'FREE' | 'SEATED' | 'ORDERED' | 'PREPARING' | 'SERVED' | 'PAYING'
  assignedStaffId?: string
}
```

### Kitchen Tickets

```ts
KitchenTicket {
  id: string
  orderId: string
  storeId: string
  status: 'NEW' | 'PREPARING' | 'READY' | 'DONE'
  station?: string
  printedAt?: Date
  readyAt?: Date
}
```

---

## UI Structure

### Recommended Restaurant Tabs

1. **Dashboard**
   - Today's sales, active orders, average prep time, delayed orders, top dishes.

2. **POS**
   - Fast menu-grid order entry.
   - Order type selector.
   - Customer/table selection.

3. **Orders**
   - Unified list for dine-in, takeaway, delivery, storefront, customer app, WhatsApp.
   - Status changes and filtering by source/type.

4. **Kitchen**
   - Tickets, timers, preparation statuses.
   - Later: station-specific views.

5. **Tables**
   - Floor plan/table list.
   - Open bills and waiter assignment.

6. **Menu**
   - Restaurant-focused product management.
   - Categories, modifiers, availability, photos.

7. **Customers & Loyalty**
   - Customer history, loyalty points, phone-based guest records.

8. **Reports**
   - Menu mix, peak hours, payment breakdown, prep-time performance.

9. **Settings**
   - Restaurant profile, opening hours, delivery/pickup settings, storefront domains, WhatsApp.

### Mobile / Tablet Considerations

Restaurants often use tablets at counters or tables:

- Large touch targets.
- Minimal typing.
- Category chips and quick modifiers.
- Sticky cart summary.
- Offline-friendly behavior for counter sales.
- Fast switch between POS and Orders/Kitchen.

---

## Order Source Strategy

All restaurant orders should flow into one order book with a clear source:

| Source | Example | Notes |
|--------|---------|-------|
| `POS` | Counter sale | Immediate payment or pay later |
| `DINE_IN` | Table 4 order | Needs table and waiter context |
| `TAKEAWAY` | Walk-in pickup | Needs ready-time estimate |
| `DELIVERY` | Phone/storefront delivery | Needs address and phone |
| `STOREFRONT` | Public subdomain/custom domain | Guest checkout |
| `WHATSAPP` | WhatsApp Flow/bot order | Same order pipeline |
| `CUSTOMER_APP` | Customer mobile/web app | Existing customer identity |

The app should display source badges so staff know how to handle the order.

---

## Subscription & Packaging

Recommended packaging:

### STARTER

- Basic POS.
- Free AlBaz subdomain storefront.
- Platform WhatsApp order alerts.
- Basic menu/inventory.

### PROFESSIONAL

- Custom vendor domain.
- Better reports.
- Basic restaurant menu features.
- One store custom domain.

### BUSINESS

- Restaurant mode.
- Kitchen tickets / KDS basic.
- Vendor-owned WhatsApp API option.
- Modifiers/add-ons.
- Delivery settings.

### ENTERPRISE

- Multi-store restaurant groups.
- Advanced KDS station routing.
- Vendor-owned WhatsApp at scale.
- Advanced analytics and integrations.
- Unlimited store custom domains.

---

## MVP Scope

The restaurant MVP should avoid overbuilding table and kitchen complexity until there are real pilots.

### MVP 1: Restaurant Storefront + POS

- Restaurant menu categories.
- Product availability control.
- Public storefront ordering.
- Guest checkout.
- WhatsApp order alert.
- Order source badges.
- Basic receipt/kitchen ticket print.

### MVP 2: Kitchen Flow

- Kitchen tab.
- Ticket statuses.
- Prep timers.
- Ready notifications.
- Cancel/reason tracking.

### MVP 3: Dine-in Tables

- Table list/floor plan.
- Open table bills.
- Split/merge bill.
- Waiter assignment.

### MVP 4: Advanced Restaurant Operations

- Modifiers.
- Menu schedules.
- Delivery zones.
- Vendor-owned WhatsApp API.
- Advanced reports.

---

## Risks & Mitigations

### Risk: Too much complexity in one POS screen

Mitigation: Restaurant mode should switch labels and tabs, not overload the generic retail flow. Use feature flags and `shopType`.

### Risk: Storefront accepts orders when restaurant is closed

Mitigation: Gate checkout by operating hours and show next opening time. Allow owner override for special days.

### Risk: Kitchen misses online orders

Mitigation: Strong notification path: dashboard sound, WhatsApp alert, optional print ticket, later KDS.

### Risk: Modifier pricing becomes inconsistent

Mitigation: Persist modifier selections and price deltas at order time. Always recompute base product price server-side.

### Risk: WhatsApp shared number becomes a bottleneck

Mitigation: Default to platform WhatsApp for MVP, but design `VENDOR_OWNED` from the start for restaurants that need their own number.

---

## Recommended Next Build Order

1. Add restaurant mode feature flag/profile based on `shopType`.
2. Add order type/source badges in POS and Orders.
3. Improve menu category UX and storefront presentation for restaurants.
4. Add item notes to storefront checkout and POS.
5. Add kitchen ticket print layout.
6. Add Kitchen tab with basic status columns.
7. Add modifier groups and options.
8. Add table management.
9. Add vendor-owned WhatsApp API onboarding.
10. Add restaurant analytics.

---

## Success Metrics

- Time to create a counter order: under 30 seconds.
- Time from storefront order to staff alert: under 10 seconds.
- Percentage of online orders accepted without phone call confirmation.
- Average prep time by dish/category.
- Cancel/refund rate by source.
- Storefront conversion rate: visits → carts → orders.
- Repeat customers by phone number.
- WhatsApp notification delivery rate.

---

## Conclusion

The restaurant version should be treated as a focused vertical profile of the existing AlBaz Vendor App. The platform already has the core ingredients: POS, product catalog, orders, public storefronts, guest checkout, WhatsApp notifications, loyalty, and vendor settings. The restaurant work should concentrate on the missing operational layer: menu modifiers, kitchen flow, dine-in tables, order timing, and restaurant-specific reporting.

The strongest near-term product is: **restaurant POS + branded storefront + WhatsApp alerts + unified order book**. This gives restaurants a real take.app-style ordering channel while keeping staff operations inside one dashboard.
