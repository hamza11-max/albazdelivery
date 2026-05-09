# Pro prompt — ALBAZ Vendor mobile UI (restaurant only)

Use this verbatim or adapted in tools such as **v0, Galileo, Uizard, Figma AI**.

## Role

Senior mobile product designer + UI engineer. Deliver **high-fidelity iPhone-first** UI (390×844) for **ALBAZ Vendor — restaurant** flows: fast service, bilingual **French + Arabic (RTL)**.

---

## Brand identity (mandatory — use exactly)

### Name / context

- **Product**: ALBAZ Vendor (restaurant back-office + floor ops).
- PWA/meta accent: **`#121b26`** (navy — treat as chrome / status / strong headers).

### Core palette — semantic tokens (light)

Match vendor app implementation:

| Token | Hex |
|--------|-----|
| Background | `#f0f2f7` |
| Foreground (primary text) | `#121b26` |
| Card | `#ffffff` |
| Primary (CTAs, key accents) | `#ea580c` |
| Primary on text | `#fffbeb` |
| Ring / focus halo | `#f97316` |
| Accent surface | `#fff7e6` |
| Accent text | `#9a3412` |
| Muted surface | `#e8ecf3` |
| Muted text | `#64748b` |
| Border / input stroke | `#cbd5e1` |
| Destructive | `#dc2626` |
| Destructive foreground | `#fef2f2` |

**Extended ALBAZ oranges**: `#ea580c` (DEFAULT), `#fb923c` (light), `#c2410c` (dark).

**Brand green** (sparse — success / go / paid): `#224c1f` (lighter `#2d5f2a`).

**Brand gold highlights**: `#fbbf24` (lighter `#fcd34d`).

### Core palette — semantic tokens (dark)

| Token | Hex |
|--------|-----|
| Background | `#0c1118` |
| Foreground | `#e8edf5` |
| Card | `#141c28` |
| Primary (dark CTAs) | `#fb923c` |
| Primary foreground | `#0c1118` |
| Ring | `#fdba74` |
| Borders | `#243044` |
| Accent surface | `#422006` |
| Accent text | `#fde68a` |

### Approved gradients / backgrounds

Use subtly on mobile (hero headers, FAB glow, premium cards):

- **Body wash (light)**: `linear-gradient(165deg, #f4f6fb 0%, #eef1f8 38%, #f8fafc 100%)`
- **Body (dark)**: `linear-gradient(135deg, #0c1118 0%, #121b26 48%, #0a0e14 100%)`
- **Brand CTA / energy**: `linear-gradient(135deg, #ea580c 0%, #fb923c 42%, #fbbf24 100%)`
- **Green affirmation** (sparse): `linear-gradient(135deg, #224c1f 0%, #2d5f2a 100%)`
- **Soft orange glow** (behind KPI chips / primary button):  
  `linear-gradient(135deg, rgba(234,88,12,0.35) 0%, rgba(251,146,60,0.22) 50%, rgba(251,191,36,0.28) 100%)`

### Elevation / surfaces (brand-consistent)

- **Neumorphism**: raised shadow (light cards):  
  `10px 10px 22px rgba(148,163,184,0.28), -8px -8px 20px rgba(255,255,255,0.92)`  
  Inset variants for inputs/toggles where appropriate.
- **Glass panels (light)**: white ~**62%** opacity + **`14px`** blur, border ~`rgba(18,27,38,0.1)`.
- **Glass panels (dark)**: ~**48%** on `#141c28` base, border ~`rgba(251,146,60,0.16)`, blur **16px**.

### Typography

- **Latin / French**: **Inter** (same as vendor app — `next/font` Inter).
- **Arabic**: Pair Inter with **one** Arabic UI font across all RTL frames — **IBM Plex Sans Arabic** or **Tajawal** (state which you picked in deliverables).
- Hierarchy: **tabular figures** for money; avoid dense desktop tables — use stacked rows on mobile.

### Iconography

Line icons for merchant ops. Accents: **`#ea580c` / `#fb923c`** on actionable items; **`#64748b`** for secondary.

---

## Scope — restaurant only

### In scope

Dashboard, POS, inventory, **orders**, **kitchen / KDS**, **QR tables & guests**, **accounting**, **drivers / delivery**, sales history, reports, coupons, sync & backup, email, public storefront controls, staff & permissions, clients & loyalty, AI insights (summary cards), RFID (optional entry points), settings.

### Out of scope

Retail/grocery-first flows; **supplier management** as a primary pillar (omit from tab bar / home shortcuts).

---

## Restaurant information architecture (mobile)

**Bottom tab bar (4–5)** + **More** sheet:

1. **Home / Today** — store open status, SLA alerts, dine-in vs delivery funnel, shortcuts to Kitchen & QR tables.
2. **POS** — fast service; restaurant: courses, modifiers, send-to-kitchen affordances (**interaction notes** if not full screens).
3. **Orders** — delivery, takeaway, table-linked orders where relevant.
4. **Kitchen** — ticket stack, timings, urgency, bump/done (KDS metaphors).
5. **More** — Inventory, Tables/QR guests, Accounting, Drivers, Sales, Reports, Coupons, Sync, Email, Storefront, Staff, Loyalty, AI, RFID, Settings.

**Pinned shortcuts on Home**: **Kitchen**, **QR tables**, **Pause orders / Open**.

---

## Screens to ship (named frames)

Include **FR + AR** placeholder copy + **RTL mirror** variants for:

Sign-in · Store picker · Home · Orders list/detail · POS main · Kitchen board · QR tables/guest · Drivers · Accounting overview (mobile summary first) · Reports summary · Coupons · Clients/loyalty (light) · Settings (language FR/AR) · Empty / loading / error for lists.

---

## UX rules

- Thumb-zone CTAs on **`#ea580c`** (light) / **`#fb923c`** (dark).
- **44px** minimum touch targets.
- Dividers **`#cbd5e1`** (light) / **`#243044`** (dark).
- Success **`#224c1f`**; warning from **`#fbbf24`** family; destructive **`#dc2626`**.
- Skeleton loaders + pull-to-refresh on list-heavy screens.

---

## Deliverables

1. **Named frames** per screen/state.
2. **Mini design system**: colors above, typography scale, spacing (8px grid), radius (e.g. 16px cards), shadows (neu + brand glow).
3. **Component inventory**: buttons, chips, cards, lists, banners, sheets, dialogs, segmented controls.
4. **RTL checklist** tied to concrete UI elements.
5. Short **interaction notes** (bottom sheets, swipe on tickets).

---

## One-liner (optional)

> ALBAZ Vendor restaurant mobile UI: navy `#121b26` chrome, orange `#ea580c` CTAs, Inter + Arabic pair, soft neu/glass cards, bilingual FR/AR with mirrored RTL — **no** retail/supplier-first flows.

---

## Source of truth in repo

Tokens align with:

- `apps/vendor/app/globals.css` (CSS variables)
- `apps/vendor/tailwind.config.js` (`albaz.*` palette, gradients, shadows)
- `apps/vendor/app/layout.tsx` (Inter, theme color `#121b26`)
