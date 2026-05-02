# Admin Enhancements - Complete Implementation Plan

**Date**: November 11, 2025 (updated 2026-04-29)  
**Status**: Phase A (platform foundations) **complete** — proceed with Phase 1+  
**Related audit:** [docs/TECHNICAL_PROJECT_AUDIT.md](docs/TECHNICAL_PROJECT_AUDIT.md) — platform-wide findings; the section **Platform foundations** below pulls mandatory work from that audit so admin features ship on a sound base.

---

## 🎯 Admin Powers & Access Enhancements

### Current Admin Capabilities
- ✅ View all users
- ✅ Approve/reject registration requests
- ✅ View all orders
- ✅ Basic analytics

### 🆕 New Enhanced Capabilities

#### 1. **User Management**
- ✅ View all users with advanced filters
- 🆕 Edit user information (name, email, phone, role)
- 🆕 Suspend/unsuspend user accounts
- 🆕 Reset user passwords
- 🆕 Delete user accounts (with confirmation)
- 🆕 View user activity logs
- 🆕 Assign/change user roles
- 🆕 Bulk user operations

#### 2. **Vendor Management**
- 🆕 Edit vendor store information
- 🆕 View vendor sales statistics
- 🆕 Manage vendor inventory remotely
- 🆕 Set vendor commissions/fees
- 🆕 Suspend/activate vendor accounts
- 🆕 View vendor performance metrics

#### 3. **Order Management**
- ✅ View all orders
- 🆕 Manually create orders
- 🆕 Cancel any order with reason
- 🆕 Refund orders directly
- 🆕 Reassign drivers to orders
- 🆕 Override order status
- 🆕 View detailed order history
- 🆕 Export orders to CSV/Excel

#### 4. **Driver Management**
- 🆕 View all drivers with real-time location
- 🆕 Assign/reassign deliveries manually
- 🆕 View driver performance statistics
- 🆕 Set driver availability
- 🆕 Manage driver documents (license, vehicle info)
- 🆕 Approve/reject driver applications
- 🆕 Set driver delivery zones

#### 5. **Product Management**
- 🆕 View all products across all vendors
- 🆕 Edit any product information
- 🆕 Feature/unfeature products
- 🆕 Manage product categories
- 🆕 Bulk import/export products
- 🆕 Approve product listings

#### 6. **Financial Management**
- 🆕 View all transactions
- 🆕 Process refunds
- 🆕 Manage vendor payouts
- 🆕 View revenue reports
- 🆕 Export financial data
- 🆕 Set platform fees/commissions
- 🆕 View payment gateway status

#### 7. **Content Management**
- 🆕 Manage delivery zones
- 🆕 Set delivery fees per zone
- 🆕 Manage categories
- 🆕 Manage promotions/coupons
- 🆕 Send platform-wide notifications
- 🆕 Manage FAQs and help content

#### 8. **Analytics & Reports**
- 🆕 Platform-wide analytics dashboard
- 🆕 Sales reports by period
- 🆕 User growth metrics
- 🆕 Order fulfillment metrics
- 🆕 Revenue forecasting
- 🆕 Vendor performance comparison
- 🆕 Driver efficiency reports
- 🆕 Export all reports

#### 9. **System Settings**
- 🆕 Manage system configuration
- 🆕 Set platform-wide settings
- 🆕 Configure payment gateways
- ✅ **Modèles d’e-mail** — table Prisma **`EmailTemplate`**, **`GET /api/admin/email-templates`** (seed automatique), **`PUT /api/admin/email-templates/[key]`**, édition dans l’onglet **Contenu** (`ContentOperationsView` / `EmailTemplateRow`). *L’envoi transactionnel ne lit pas encore ces modèles partout — branchement mail à faire au fil des flux.*
- 🆕 Configure notification settings
- 🆕 Set business rules (min order, delivery fees, etc.)
- ✅ **Intégrations (env)** — **`GET /api/admin/system/config`** expose **`integrationKeys`** (présence **`configured`** par variable : Stripe, NextAuth, DB, Redis/Upstash, Resend). Aucune valeur secrète renvoyée.

#### 10. **Support & Moderation**
- 🆕 View all support tickets
- 🆕 Respond to customer issues
- 🆕 Escalate tickets
- 🆕 View and moderate reviews
- 🆕 Ban/warn problematic users
- 🆕 Handle disputes

---

## 🔒 Platform foundations (from Technical Project Audit)

*These are not only “admin” tasks but **block production quality** for admin, vendor, and customer surfaces. They should be scheduled **before or in parallel** with feature phases below.*

### Critical blockers to clear

| # | Item | Why it matters for admin & ops |
|---|------|--------------------------------|
| 1 | **`await` every `applyRateLimit`** (or make limiter always sync-safe) | Prevents DoS and abuse; without `await` on Redis/Upstash, limits may not run. |
| 2 | **Subscription rules** — gate `STARTER` / avoid auto-creating trial on `GET` | Stops revenue and entitlement abuse visible in admin subscription views. |
| 3 | **One canonical API path** per resource — remove/redirect duplicate `app/api/.../.../.../route` trees | Admins and dashboards must not call divergent routes (wrong or empty data). |
| 4 | **Guest / dine-in JSON storage** | Either Electron-only + documented, or Postgres-backed; avoid serverless data loss. |
| 5 | **Vendor staff “permissions”** | Document single-login model **or** server-side RBAC before delegating staff in POS. |
| 6 | **Tests** — unskip payment/checkout tests; expand e2e past `auth` | Refunds, manual orders, and financial admin actions need regression safety. |
| 7 | **Admin state-changing routes** | Consistent **CSRF** and `ForbiddenError` for non-admin (audit flagged inconsistency). |

### Immediate priority roadmap (audit)

1. Audit every `applyRateLimit` call — use `await applyRateLimit(...)` everywhere, or unify the helper so the Redis path cannot be skipped.
2. Remove or strict-gate “free **STARTER** / upsert on **GET**” subscription behavior; align with product rules.
3. Deprecate or fix **duplicate** nested `route.ts` trees under `app/api/`; one canonical URL per resource.
4. **Guest/dine-in:** declare Electron-only and block on serverless, or move to Postgres.
5. **Minimal e2e:** registration → order → payment webhook (mock) + one admin path.
6. **Staff permissions:** product decision + server enforcement if multi-user vendor access is required.

### Completion signal (from audit)

| Area | ~Realistic % today | Target before “broad” launch |
|------|--------------------|--------------------------------|
| Frontend (admin + vendor + customer) | ~55–65% | 75%+ with tests |
| Backend / APIs | ~50–60% | No duplicate critical routes; awaits on limits |
| Infrastructure | ~35–45% | Redis/queues configured or in-memory documented |
| Production readiness | ~40–50% | E2E on money paths; no critical audit blockers |

Full detail: [docs/TECHNICAL_PROJECT_AUDIT.md](docs/TECHNICAL_PROJECT_AUDIT.md).

---

## 📋 Implementation Checklist

### Phase 0: Platform foundations (audit — **Phase A complete**)
- [x] Rate limiting: **`await applyRateLimit`** on API routes enforced by **`npm run check:rate-limit`** (+ Upstash presets when configured). See **`verify:phase-a`**.
- [x] Subscriptions: `STARTER` / GET rules gated; see `lib/api-subscriptions.ts`, `ENV_TEMPLATE.md`.
- [x] **Root** API cleanup: nested `delivery/`, `driver/`, `erp/`, `vendors/`, `drivers/`, `auth/` → canonical **`app/api`** handlers (`@deprecated` re-exports).
- [x] Guest orders: deployment guard + env (**Postgres-backed guest storage** = Phase B/C if needed).
- [x] E2E baseline: **`tests-e2e/api-smoke.spec.ts`** + **`tests-e2e/auth.spec.ts`**.
- [ ] Full **registration → order → payment** e2e — **Phase B+** (beyond Phase A bar).
- [ ] Admin APIs: exhaustive **CSRF + role checks** on every mutating route — ongoing; elevated in Phase B audits.
- [ ] Optional **`AuditLog`**: **Phase B/C** backlog as in original plan.

### Phase B: Product hardening (audit) — **complete** (see TECHNICAL_PROJECT_AUDIT Phase B)

Operational docs: notifications, BullMQ/Redis, ERP vs storefront catalog. Webhook structured logging + Sentry hook; **`verify:phase-b`**; CSRF tightened on listed admin mutations. **Not done here:** universal admin CSRF pass, DLQ for webhooks, order-payment idempotency.

### Phase C: Excellence (audit) — **complete**

Changelog root file, architecture snapshot, legacy status-doc index, demand API `predictionMeta`, Phase C Playwright boundary test + **`verify:phase-c`**. Full-money-path e2e remains backlog.

### Phase 1: Core User Management ✅
- [x] View users with filters
- [x] Edit user profile (**`EditUserDialog`** + **`PUT /api/admin/users/[id]`**)
- [x] Suspend/unsuspend users (bulk + API: suspend / unsuspend)
- [x] Reset passwords (**dialog** + **`POST /api/admin/users/[id]/reset-password`**; comptes **ADMIN**/**SUPER_ADMIN** : autre admin ne peut réinitialiser que si **`SUPER_ADMIN`** ; soi-même toujours autorisé)
- [x] Delete users with confirmation
- [x] Bulk operations

### Phase 2: Vendor & Driver Management — **done (admin “Ops V/D” + APIs)**
- [x] Vendor store management (**`GET/PATCH /api/admin/stores`** — list + edit actif, adresse, délai…)
- [x] Vendor statistics (**`GET /api/admin/vendors/statistics`** — magasins, commandes, CA livré)
- [x] Driver location tracking (**`GET /api/admin/drivers/overview`** — lat/lng / statut dernier signalement)
- [x] Manual delivery assignment (**`POST /api/admin/orders/[orderId]/assign-driver`** — READY | ASSIGNED + notification)
- [x] Performance metrics (**`DriverPerformance` + comptage livraisons livrées dans overview**)

### Phase 3: Order & Financial Management — **done (admin “Commandes” tab + APIs)**
- [x] Create orders manually (**`POST /api/admin/orders/manual`** — clientId + lignes comme checkout)
- [x] Advanced order management (**`GET/PATCH /api/admin/orders/[orderId]`** — statut admin + timestamps)
- [x] Refund processing (**`GET/POST /api/admin/refunds`** — remboursement commande quelconque avec paiement)
- [ ] Payout management (**backlog** — hors modèle payouts dédié pour l’instant)
- [x] Financial reports (**`GET /api/admin/financial/summary`** — agrégés CA livré, remb., volumes)

*Parité déploiement : les routes ci-dessus existent aussi sous **`app/api/admin/...`** à la racine du repo (Next principal), en plus de **`apps/admin`**.*

### Phase 4: Content & System Management — **done** (admin tab « Contenu » + APIs)
- [x] Delivery zone management (**`GET/POST /api/admin/delivery-zones`**, **`PATCH/DELETE /api/admin/delivery-zones/[id]`** — zones, polygon, frais/délais)
- [x] Category management (**`GET/POST /api/admin/catalog-categories`**, **`PATCH/DELETE /api/admin/catalog-categories/[id]`** — slugs FR/AR, magasins liés)
- [x] Promotion/coupon system (**`GET/POST /api/admin/promo-codes`**, **`PATCH /api/admin/promo-codes/[id]`**)
- [x] Platform notifications (**`POST /api/admin/notifications/broadcast`** — rôle ou ids ciblés)
- [x] System configuration (**`GET /api/admin/system/config`** — indicateurs sans secrets : env, URL auth, toggles connus, **`integrationKeys`** pour diagnostic des clés côté serveur)
- [x] Modèles e-mail admin (**`EmailTemplate`**, **`GET/PUT`** sous **`/api/admin/email-templates`** ; UI Contenu)

*Parité déploiement : les routes Phase 4 existent aussi sous **`app/api/admin/...`** à la racine du repo (Next principal), en plus de **`apps/admin`**.*

### Phase 5: Analytics & Reports — **done** (onglet « Analytique » + APIs)
- [x] Comprehensive analytics dashboard (**`GET /api/admin/analytics`** — période, regroupement, courbes, top vendeurs)
- [x] Custom report builder (**`ReportExportsPanel`** — période, export CSV utilisateurs/commandes/audit + export JSON agrégé)
- [x] Export functionality (**`POST /api/admin/export`** — CSV ou JSON ; CSRF sur mutation)
- [x] Real-time metrics (**`GET /api/admin/analytics/live`** — actualisation ~30 s : actives, 1 h, 24 h, CA 24 h)

*Parité déploiement : les routes ci-dessus existent aussi sous **`app/api/admin/...`** à la racine du repo (Next principal), en plus de **`apps/admin`**.*

### Admin shell — Support & produits (**complété**)

- [x] **Onglet Support** — liste tickets **`GET /api/support/tickets`** (les admins voient tous les tickets), mise à jour statut **`PATCH /api/support/tickets/[id]`** avec **`fetchWithCsrf`**. Composant : **`AdminSupportTicketsView`**.
- [x] **Onglet Produits** — **`GET /api/admin/products`** (liste multi-magasins, filtres magasin / disponibilité / recherche), activation ou désactivation via **`PATCH /api/products`** existante. Composant : **`AdminProductsView`**. Route **`app/api/admin/products`** dupliquée à la racine pour parité déploiement. **Réservé aux comptes full admin** — le rôle plateforme **`SUPPORT`** n’a pas cet onglet ni cet accès API (voir **Support Admin** ci‑dessous).

---

## 🔐 Permission Levels (implémentation actuelle)

Les capacités ci‑dessous sont **appliquées dans `lib/admin-roles.ts`** et les routes **`/api/admin/*`** (sessions **ADMIN** et **SUPER_ADMIN** utilisent `isFullAdmin()` pour l’accès « full admin » ; **`canMutateOpsAsFullAdmin`** = **ADMIN** ou **SUPER_ADMIN**).

### Super Admin (`Role.SUPER_ADMIN`)

- Même périmètre opérationnel qu’**ADMIN** (catalogue, finance, exports, etc.).
- **Seul** rôle autorisé à : supprimer ou suspendre des comptes **ADMIN** / **SUPER_ADMIN** (hors soi), réinitialiser le mot de passe d’un autre admin, **assigner** ou **retirer** le rôle **SUPER_ADMIN**, créer via **`POST /api/admin/users`** un compte staff (**ADMIN** / **SUPER_ADMIN** / **SUPPORT**).
- **Promotion** : `ADMIN_PROMOTE_SUPER=1` ou `ADMIN_ROLE=SUPER_ADMIN` avec **`scripts/create-admin-user.ts`**, ou assignation dans **`EditUserDialog`** (option visible uniquement si l’utilisateur connecté est super admin).

### Admin (`Role.ADMIN`)

- Accès complet aux onglets et APIs **full admin** (comme super admin pour le quotidien).
- **Ne peut pas** : supprimer / suspendre en masse ou isolément un autre **ADMIN** ou **SUPER_ADMIN**, réinitialiser le mot de passe d’un autre administrateur, promouvoir en **SUPER_ADMIN**, ni créer des comptes **ADMIN**/**SUPER_ADMIN**/**SUPPORT** via **`POST /api/admin/users`**.

### Support Admin (`Role.SUPPORT`)

Compte **support desk** : même entrée `/admin` que les admins (app client : redirection non‑customer vers `/admin`), mais **shell et API restreints**.

**Modèle et session**

- Enum Prisma **`SUPPORT`** (migration enum PostgreSQL si besoin).
- NextAuth : **`UserRole`** inclut **`SUPPORT`** (`lib/auth.config.ts` — JWT / session typés comme le rôle en base).
- **Création du compte** : un **super admin** crée le staff via **`POST /api/admin/users`** ou un **admin complet** assigne le rôle via **`EditUserDialog`** + **`PUT /api/admin/users/[id]`** (`role: SUPPORT` dans le schéma zod).

**Logique d’accès partagée** — `lib/admin-roles.ts` (extraits utiles) :

- **`canAccessAdminApp`** — ouvre le panneau admin pour **ADMIN**, **SUPER_ADMIN** et **SUPPORT**.
- **`canViewAllOrdersAsStaff`** — liste / détail commandes en **lecture** pour staff (**ADMIN** + **SUPER_ADMIN** + **SUPPORT**).
- **`canMutateOpsAsFullAdmin`** — mutations ops lourdes (**PATCH** commande, **GET/PATCH** catalogue admin produits, etc.) — **ADMIN** ou **SUPER_ADMIN**.
- **`canAccessSupportTicketEscalation`** — gestion / escalade tickets côté staff (**ADMIN** + **SUPER_ADMIN** + **SUPPORT**). Assignation possible vers **ADMIN** / **SUPER_ADMIN** / **SUPPORT**.

**UI (`apps/admin/app/admin/page.tsx`)**

- **Déploiement racine (Vercel `vercel-build`)** : même logique dans **`app/admin/page.tsx`** — accès via **`canAccessAdminApp`**, onglets **Tableau de bord**, **Command Center** (SLA sans surveillance espèces), **Support** ; chargement **`fetchOrders`** seul, en-tête support sans Passkeys, tickets via **`AdminSupportTicketsView`** sous **`app/admin/components/`**.
- Onglets visibles (app dédiée **`@albaz/admin`**) : **Tableau de bord**, **Command Center**, **Support** uniquement. Les autres **`TabsTrigger`** / **`TabsContent`** ne sont pas rendus pour **`SUPPORT`** (pas de contournement par URL d’onglet).
- **`useAdminData('support')`** — charge surtout les commandes ; pas le même churn utilisateurs / approbations qu’en mode **`full`**.
- **`DashboardView`** reçoit **`supportMode`** (masque cartes revenus / métriques sensibles selon implémentation).
- **Command Center** : section **surveillance espèces** masquée pour le support ; texte indique la lecture seule.
- **`AdminHeader`** : prop **`supportDesk`** — titre « Support — Administration », sous‑titre file support, lien **Passkeys** masqué.

**API (résumé)**

| Zone | Comportement |
|------|----------------|
| **`GET /api/admin/orders`**, **`GET /api/admin/orders/[orderId]`** | **ADMIN** + **SUPER_ADMIN** + **SUPPORT** (lecture). |
| **`PATCH /api/admin/orders/[orderId]`** | **ADMIN** ou **SUPER_ADMIN**. |
| **`GET/PATCH` tickets** (ex. **`/api/support/tickets/[id]`**) | Lecture / mise à jour staff selon règles actuelles ; escalade alignée sur **`canAccessSupportTicketEscalation`**. |
| **`GET/PATCH /api/admin/products`** (et onglet Produits) | **Full admin** (**ADMIN** / **SUPER_ADMIN**) — **SUPPORT** exclu. |

**À faire côté déploiement** : migrations Prisma pour les enums **`SUPPORT`** et **`SUPER_ADMIN`**, la table **`EmailTemplate`**, puis **`prisma generate`**.

---

## 🎯 Priority Features

### High Priority (Implement First)
0. ~~**Phase 0**~~ **(Phase A complete)** — see [TECHNICAL_PROJECT_AUDIT](docs/TECHNICAL_PROJECT_AUDIT.md) Enhancement plan; use **`npm run verify:phase-a`** for regressions  
1. ~~Edit user information~~ (admin: edit + reset password UI; APIs in place)
2. ~~Suspend/unsuspend users~~ (bulk UI + APIs)
3. ~~Manual order creation~~ (API + admin)
4. ~~Refund processing~~
5. ~~Driver reassignment~~
6. ~~Platform analytics~~

### Medium Priority
1. ~~Bulk operations~~
2. ~~Product management across vendors~~
3. ~~Financial reports~~ (résumé **`/api/admin/financial/summary`**)
4. ~~Delivery zone management~~
5. ~~Promotion management~~

*La liste ci‑dessus décrivait surtout le backlog historique ; les items barrés sont couverts par les phases 1–5 et l’onglet Produits.*

### Low Priority
1. ~~Custom report builder~~ (**`ReportExportsPanel`** / exports)
2. ~~API key management~~ (lecture **`integrationKeys`** dans config admin — pas d’édition de secrets en base)
3. ~~Email template editor~~ (édition en base + API ; **branchement envoi** mail encore partiel)
4. Advanced forecasting (hors **`predictionMeta`** / API demande — amélioration produit possible)

---

## 🔧 Technical Implementation

### API Routes to Create
```
POST   /api/admin/users/[id]/suspend
POST   /api/admin/users/[id]/unsuspend
PUT    /api/admin/users/[id]
DELETE /api/admin/users/[id]
POST   /api/admin/users/[id]/reset-password

POST   /api/admin/orders/create
POST   /api/admin/orders/[id]/refund
PUT    /api/admin/orders/[id]/reassign-driver

GET    /api/admin/vendors/[id]/statistics
PUT    /api/admin/vendors/[id]/store
POST   /api/admin/vendors/[id]/suspend

GET    /api/admin/drivers/locations
POST   /api/admin/drivers/[id]/assign-delivery

GET    /api/admin/financial/transactions
GET    /api/admin/financial/payouts
POST   /api/admin/financial/payout/[id]/process

GET    /api/admin/analytics/dashboard
GET    /api/admin/analytics/reports
GET    /api/admin/analytics/export

POST   /api/admin/zones
PUT    /api/admin/zones/[id]
DELETE /api/admin/zones/[id]

POST   /api/admin/promotions
PUT    /api/admin/promotions/[id]
DELETE /api/admin/promotions/[id]

GET    /api/admin/email-templates
PUT    /api/admin/email-templates/[key]
GET    /api/admin/system/config
```

### Database Additions
```sql
-- Admin action logs
CREATE TABLE admin_actions (
  id VARCHAR PRIMARY KEY,
  admin_id VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  target_type VARCHAR NOT NULL,
  target_id VARCHAR,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Platform settings
CREATE TABLE platform_settings (
  key VARCHAR PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by VARCHAR,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📱 UI Enhancements

### Admin Dashboard Tabs
1. **Overview** - Platform statistics
2. **Users** - User management
3. **Vendors** - Vendor management
4. **Drivers** - Driver management  
5. **Orders** - Order management
6. **Products** - Product oversight
7. **Financial** - Payments & payouts
8. **Support** - Tickets & issues
9. **Analytics** - Reports & metrics
10. **Settings** - System configuration

---

## 🎨 New Admin Components

### Components to Create
- UserEditDialog
- UserSuspendDialog
- OrderCreateDialog
- RefundDialog
- DriverAssignDialog
- VendorStoreEditor
- ZoneEditor
- PromotionEditor
- AnalyticsCharts
- BulkActionDialog

---

## 📊 Success Metrics

- **Zero unresolved critical items** from [TECHNICAL_PROJECT_AUDIT.md](docs/TECHNICAL_PROJECT_AUDIT.md) in production (rate limits, subscription abuse paths, duplicate API confusion)
- Admin can perform 90% of operations without developer help
- Average task completion time reduced by 50%
- User issue resolution time < 24 hours
- Platform uptime > 99.9%
- Admin satisfaction score > 4.5/5

---

**Status**: Phase 0 / **Phase A** foundations **complete** — start **Phase 1** feature work
**Next**: ~~Complete Phase 0 checklist~~ Phase A complete → prioritize **Phase 1** features; run **`npm run verify:phase-a`** when touching platform/API code.

