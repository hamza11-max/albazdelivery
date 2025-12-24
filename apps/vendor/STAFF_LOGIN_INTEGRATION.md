# Staff Login & Management Integration Guide

## Overview
This document describes the staff login system and management features added to the vendor Electron app.

## Components Created

### 1. StaffLoginScreen (`apps/vendor/components/StaffLoginScreen.tsx`)
- Shows after main vendor login
- Allows staff members to select their profile and enter password
- Supports roles: owner, manager, cashier, staff

### 2. VendorHeader (`apps/vendor/components/VendorHeader.tsx`)
- Header component with logo, current staff info, role switching, and logout
- Shows current staff name and role
- Role change button (only for owner/manager)

### 3. Staff Management Page (`apps/vendor/app/vendor/staff/page.tsx`)
- Independent page for managing staff members
- Only accessible to owners
- Add, edit, delete staff members
- Accessible via sidebar navigation

## Integration Steps

### Step 1: Add State to Vendor Page

Add these state variables to `apps/vendor/app/vendor/page.tsx`:

```typescript
// Add after existing state declarations
const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null)
const [showStaffLogin, setShowStaffLogin] = useState(false)

// Load current staff on mount
useEffect(() => {
  try {
    const stored = localStorage.getItem("vendor-current-staff")
    if (stored) {
      setCurrentStaff(JSON.parse(stored))
    } else if (isAuthenticated) {
      // Show staff login if authenticated but no staff selected
      setShowStaffLogin(true)
    }
  } catch {
    // ignore
  }
}, [isAuthenticated])
```

### Step 2: Add Imports

Add to imports section:

```typescript
import { StaffLoginScreen, type StaffUser } from "../../components/StaffLoginScreen"
import { VendorHeader } from "../../components/VendorHeader"
```

### Step 3: Update Return Statement

Before the main content, add staff login screen check:

```typescript
// Show staff login if needed
if (showStaffLogin && isAuthenticated) {
  return (
    <StaffLoginScreen
      vendorName={shopInfo.name || user?.name}
      onStaffLogin={(staff) => {
        setCurrentStaff(staff)
        setShowStaffLogin(false)
      }}
      translate={translate}
    />
  )
}
```

### Step 4: Add Header Component

Add the header after the sidebar, before main content:

```typescript
{/* Header */}
<VendorHeader
  vendorName={shopInfo.name || user?.name}
  currentStaff={currentStaff}
  onRoleChange={() => {
    setShowStaffLogin(true)
    setCurrentStaff(null)
  }}
  translate={translate}
/>
```

### Step 5: Update Dashboard to Filter Sales

In the DashboardTab component, filter sales by current staff:

```typescript
// Calculate filtered sales
const filteredSales = useMemo(() => {
  if (!currentStaffId) return sales
  return sales.filter(sale => sale.staffId === currentStaffId)
}, [sales, currentStaffId])

// Use filteredSales for calculations
const todaySales = useMemo(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return filteredSales
    .filter(sale => {
      const saleDate = new Date(sale.createdAt)
      saleDate.setHours(0, 0, 0, 0)
      return saleDate.getTime() === today.getTime()
    })
    .reduce((sum, sale) => sum + sale.total, 0)
}, [filteredSales])
```

### Step 6: Remove Staff Management from Settings

The staff management section has been removed from DashboardTab. It's now only accessible via the dedicated staff page.

### Step 7: Update Sidebar Navigation

The sidebar has been updated to include a "Staff" menu item that navigates to `/vendor/staff`.

## API Routes

### GET /api/vendor/staff
Returns list of staff members

### POST /api/vendor/staff
Creates a new staff member

### PUT /api/vendor/staff
Updates an existing staff member

### DELETE /api/vendor/staff
Deletes a staff member

### POST /api/vendor/staff/verify
Verifies staff password

## Sales Filtering

When a staff member is logged in, the dashboard will:
- Show only sales made by that staff member
- Calculate metrics (today, week, month) based on filtered sales
- Display staff name and role in the header

## Role Permissions

- **Owner**: Full access, can manage staff, change roles
- **Manager**: Can change roles, limited staff management
- **Cashier**: Limited access, can only process sales
- **Staff**: Basic access, view-only for most features

## Storage

Staff data is stored in:
- `localStorage.getItem("vendor-staff-list")` - All staff members
- `localStorage.getItem("vendor-current-staff")` - Currently logged in staff

## Next Steps

1. Integrate the state and components into the vendor page
2. Update sales API to include `staffId` field
3. Update dashboard calculations to use filtered sales
4. Test the complete login flow

