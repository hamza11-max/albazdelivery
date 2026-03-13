# APIs connected between Admin app and Customer app

Both apps share the same **database** (Prisma) and **domain data**. Below are the API surfaces and how they connect.

---

## 1. Shared data, same or equivalent APIs

| Data / API | Customer app | Admin app | Connection |
|------------|--------------|-----------|------------|
| **Orders** | `GET /api/orders` (own orders), `POST /api/orders`, `GET/PATCH /api/orders/[id]` | `GET /api/orders` or `GET /api/admin/orders` (all orders, with filters) | Same `Order` table. Customer creates and views their orders; admin lists all orders and can filter by customer/vendor/driver/status. |
| **Users** | `POST /api/auth/login` (auth only); registration may create users | `GET /api/admin/users` (list by role), `GET/PUT/DELETE /api/admin/users/[id]`, suspend/unsuspend/reset-password | Same `User` table. Customers are users with role CUSTOMER; admin manages all users (customers, drivers, vendors). |
| **Auth / session** | Session after login | Session for admin role | Same auth/session mechanism; role determines access. |

So the main **APIs that connect admin and customer** in terms of shared backend and data are:

- **Orders API** – Customer: create order, list own orders, get/update order. Admin: list all orders (and optionally update). Same backend logic in customer app (`apps/customer/app/api/orders`) uses `session.user.role` (e.g. ADMIN sees all, CUSTOMER sees own). Admin app has its own route `apps/admin/app/api/admin/orders` for admin-only list.
- **Users / Auth** – Customer: login (and possibly register). Admin: list users, get/update/delete user, suspend/unsuspend, reset password. Same `User` model; admin manages the same accounts customers use to log in.

---

## 2. API paths by app

### Customer app (web + Expo)

- **Orders:** `GET /api/orders`, `POST /api/orders`, `GET /api/orders/[id]`, `PATCH /api/orders/[id]`
- **Stores:** `GET /api/stores`, `GET /api/stores/[id]`
- **Categories:** `GET /api/categories`, `GET /api/categories/[id]`
- **Products:** `GET /api/products`, `PATCH /api/products`
- **Delivery:** `GET /api/delivery/fee?city=...`
- **Promo:** `POST /api/promo/validate`
- **Addresses:** `GET/POST/PUT/DELETE /api/addresses`
- **Wallet:** `GET /api/wallet/balance`, `GET /api/wallet/transactions`, `POST /api/wallet/balance`
- **Loyalty:** `GET /api/loyalty/account`, `GET /api/loyalty/rewards`, `POST /api/loyalty/rewards`, `GET /api/loyalty/transactions`
- **Notifications:** `GET /api/notifications`, `PUT /api/notifications`, `DELETE /api/notifications`
- **Reviews:** `GET/POST /api/ratings/reviews`, helpful, response
- **Payments:** `POST /api/payments/create`, `GET /api/payments/history`
- **Package delivery:** `POST /api/package-delivery/create`
- **Support:** `GET/PATCH /api/support/tickets/[id]`
- **Auth:** `POST /api/auth/login`

### Admin app

- **Orders:** `GET /api/admin/orders` (all orders; admin-only).  
  Note: `useAdminData` currently calls `GET /api/orders`; if admin runs as a separate app, that may need to be `GET /api/admin/orders` or the same backend must expose `GET /api/orders` for admin session.
- **Users:** `GET /api/admin/users`, `GET/PUT/DELETE /api/admin/users/[id]`, suspend, unsuspend, reset-password, bulk
- **Registration requests:** `GET /api/admin/registration-requests`, `POST /api/admin/registration-requests` (approve/reject)
- **Analytics:** `GET /api/admin/analytics`
- **Export:** `POST /api/admin/export`
- **Ads:** `GET/POST /api/admin/ads`, `GET/PUT/DELETE /api/admin/ads/[id]`
- **Subscriptions:** `GET/POST /api/admin/subscriptions`, `PATCH /api/admin/subscriptions/[id]`
- **Audit logs:** `GET /api/admin/audit-logs`
- **CSRF:** `GET /api/csrf-token`

---

## 3. Summary: what connects them

| Connection | Description |
|------------|-------------|
| **Orders** | Same orders: customer creates and views their own; admin views (and optionally manages) all. Implemented in customer app by role in `GET/POST /api/orders` and in admin app as `GET /api/admin/orders`. |
| **Users** | Same user table. Customers log in via auth; admin lists and manages those same users (including customers) via `/api/admin/users`. |
| **Database** | Both use the same Prisma schema and DB (e.g. `@/root/lib/prisma`), so Order, User, Store, Product, etc. are shared. |

There are no customer-only APIs that admin calls directly; the link is **shared data** (orders, users) and **role-based access** on the same endpoints or on dedicated admin routes that read/write the same tables.
