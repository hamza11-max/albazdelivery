# Vendor App Layout Structure

## Overall Application Hierarchy

```
html (lang="fr", suppressHydrationWarning)
│
└── body
    │
    └── SessionProvider
        │
        └── ThemeInitializer
            │
            └── ErrorBoundary
                │
                └── div.min-h-screen.bg-slate-50
                    │
                    └── VendorSidebarWrapper (in apps/vendor/app/layout.tsx)
                        │
                        ├── VendorSidebar (icon-only sidebar on left)
                        │   │
                        │   ├── Icon Navigation (desktop: md:pl-20, lg:pl-[240px])
                        │   ├── Language Toggle (Fr/Ar)
                        │   ├── Theme Toggle (Light/Dark)
                        │   └── Logout Button
                        │
                        └── main.min-h-screen.md:pl-20.lg:pl-[240px].pb-24
                            │
                            └── VendorDashboard (apps/vendor/app/vendor/page.tsx)
                                │
                                └── div.min-h-screen.bg-background
                                    │
                                    └── POSDashboard (imported from @/root/components/POSDashboard)
                                        │
                                        ├── Sidebar with Product Categories
                                        ├── Product Grid
                                        ├── Shopping Cart
                                        ├── Numeric Keypad
                                        ├── Order Summary
                                        └── Action Buttons (Payment, Refund, etc.)
```

## File Structure

### Root Files

```
apps/vendor/
├── app/
│   ├── layout.tsx (VendorLayout with VendorSidebarWrapper)
│   ├── vendor/
│   │   └── page.tsx (VendorDashboard - renders POSDashboard)
│   └── globals.css
│
├── public/
│   └── logo.svg
│
└── components/ (vendor-specific dialogs, tabs, etc.)
    └── POSDashboard.tsx (local vendor copy, currently unused)

components/ (root/shared)
├── VendorSidebarWrapper.tsx
├── VendorSidebar.tsx
├── POSDashboard.tsx (the main POS component used)
└── Header.tsx
```

## Component Responsibilities

### 1. **VendorLayout** (`apps/vendor/app/layout.tsx`)
- **Role**: Root layout for the vendor app
- **Provides**: 
  - SessionProvider (authentication context)
  - ThemeInitializer (dark mode context)
  - ErrorBoundary (error handling)
  - VendorSidebarWrapper (main layout structure)
- **Children**: All pages under `/vendor` route

### 2. **VendorSidebarWrapper** (`components/VendorSidebarWrapper.tsx`)
- **Role**: Layout wrapper that provides sidebar + main content area
- **State Manages**:
  - `activeTab` - current active tab/page
  - `language` - fr or ar
  - `isDarkMode` - light/dark theme
- **Children Padding**: 
  - Desktop (md): `pl-20` (5rem = 80px for icon sidebar)
  - Large (lg): `pl-[240px]` (240px for expanded sidebar)
- **Bottom Padding**: `pb-24` (for mobile bottom nav)

### 3. **VendorSidebar** (`components/VendorSidebar.tsx`)
- **Role**: Icon-only navigation sidebar
- **Features**:
  - Responsive: Icon-only on mobile, expands on hover/click on desktop
  - Menu items with hover labels (LayoutDashboard, Package, ShoppingCart, etc.)
  - Language toggle (Fr ↔ Ar)
  - Dark mode toggle (Sun/Moon icons)
  - Logout button
- **Fixed Position**: Sticky on left side
- **Menu Items**:
  1. Tableau de bord (Dashboard)
  2. Inventaire (Inventory)
  3. Point de Vente (POS)
  4. Ventes (Sales)
  5. Clients (Customers)
  6. Fournisseurs (Suppliers)
  7. Analyse IA (AI Analysis)
  8. Paramètres (Settings)

### 4. **VendorDashboard** (`apps/vendor/app/vendor/page.tsx`)
- **Role**: Page component for `/vendor` route
- **Simple structure**:
  ```tsx
  <div className="min-h-screen bg-background">
    <POSDashboard />
  </div>
  ```
- **Content**: Renders the POSDashboard component

### 5. **POSDashboard** (`components/POSDashboard.tsx`)
- **Role**: Point of Sale interface
- **Features**:
  - Product grid with category filters
  - Shopping cart management
  - Numeric keypad for quantities
  - Order summary with discount/coupon inputs
  - Payment/Refund action buttons
  - Responsive design (mobile-first)
- **State Management**:
  - `cart` - items in shopping cart
  - `filterCategory` - active product category filter
  - `quantity` - keypad input
  - `isSummaryOpen` - expand/collapse order summary

## Responsive Behavior

| Screen Size | Sidebar Width | Sidebar State | Main Content Padding |
|-------------|---------------|---------------|----------------------|
| Mobile     | 80px (icons)  | Icon-only     | `pl-20` (md)         |
| Tablet     | 80px (icons)  | Icon-only     | `pl-20` (md)         |
| Desktop    | 240px (expanded) | Full menu | `pl-[240px]` (lg)    |
| Bottom nav | N/A           | Bottom nav    | `pb-24`              |

## Data Flow

1. **User Authentication** → `SessionProvider` → available to all components
2. **Theme Preference** → `ThemeInitializer` → applied to HTML root
3. **UI State** (language, dark mode) → `VendorSidebarWrapper` → passed to `VendorSidebar`
4. **Navigation** → `setActiveTab` in sidebar → updates active page
5. **POS Logic** → `POSDashboard` manages its own cart/product state

## CSS Classes Used

- **Layout**: `min-h-screen`, `flex`, `gap-6`
- **Sidebar**: `sticky`, `top-6`, `w-64`, `flex flex-col`, `space-y-2`
- **Responsive**: `md:pl-20`, `lg:pl-[240px]`, `pb-24`
- **Typography**: `text-lg`, `font-bold`, `text-muted-foreground`
- **Background**: `bg-background`, `bg-slate-50`
- **Animations**: `transition-all`, `duration-200`

## Key Dependencies

- **Next.js 15.5**: App Router with React Server Components
- **React 18.3**: Client components with hooks
- **Tailwind CSS**: Utility-first styling
- **lucide-react**: Icon library
- **next-auth**: Authentication
- **@albaz/ui**: Custom UI components (Button, Label, Tabs, etc.)

## Mobile Bottom Navigation

- Vendor sidebar includes mobile-optimized bottom navigation
- Padding: `pb-24` on main content to prevent overlap
- Responsive: Only visible on mobile screens below `md` breakpoint

## Current State

✅ Icon-only sidebar (VendorSidebar) - Active  
✅ POSDashboard component - Imported and rendered  
✅ Responsive layout - Mobile first  
✅ Multi-language support - French/Arabic  
✅ Dark mode support - Light/Dark theme toggle  
❌ Multiple tabs/pages - Currently only POS is rendered
