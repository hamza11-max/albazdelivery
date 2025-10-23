# 🎨 Frontend Integration Guide

**Status**: API Client & Hooks Created ✅  
**Date**: January 2025

---

## 📋 Overview

This guide explains how to integrate the frontend with the newly migrated backend APIs. All API routes are now production-ready with authentication, validation, and error handling.

---

## ✅ What's Already Done

### 1. Authentication Integration ✅
- ✅ Login page uses `signIn()` from NextAuth
- ✅ Pages use `useSession()` hook
- ✅ Auth state management is working
- ✅ Protected routes via middleware

### 2. API Client Created ✅
**Location**: `lib/api-client.ts`

Provides centralized API calls for:
- Orders (list, create, update status)
- Products (list, update)
- Wallet (balance, transactions, top-up)
- Loyalty (account, rewards, redeem)
- Notifications (list, mark read, delete)
- Driver (deliveries, location, accept)
- Admin (users, registration requests)
- Reviews (list, create, respond)
- Payments (create, history)
- Package Delivery (create)
- Support (tickets)

### 3. React Hooks Created ✅
**Location**: `hooks/use-api.ts`

Provides ready-to-use hooks:
- `useOrders(status?)` - Fetch orders
- `useOrder(orderId)` - Fetch single order
- `useWallet()` - Get wallet balance
- `useLoyaltyAccount()` - Get loyalty info
- `useNotifications()` - Get notifications
- `useDriverDeliveries()` - Get deliveries for driver
- `useUsers()` - Admin user management
- Action hooks for mutations

---

## 🔧 How to Use the API Client

### Basic Pattern

```typescript
import { ordersAPI, walletAPI } from '@/lib/api-client'

// In your component
async function loadData() {
  try {
    const response = await ordersAPI.list({ status: 'PENDING' })
    console.log(response.data) // Type-safe data
  } catch (error) {
    console.error('Error:', error.message)
  }
}
```

### Using React Hooks (Recommended)

```typescript
'use client'

import { useOrders, useCreateOrder } from '@/hooks/use-api'

export default function OrdersPage() {
  // Fetch data with loading/error states
  const { data, loading, error, refetch } = useOrders('PENDING')
  
  // Action hook for mutations
  const { execute: createOrder, loading: creating } = useCreateOrder()

  const handleCreateOrder = async () => {
    try {
      await createOrder({
        storeId: 'store-id',
        items: [...],
        total: 1000,
        // ... other fields
      })
      refetch() // Refresh the list
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {data?.orders?.map(order => (
        <div key={order.id}>{order.id}</div>
      ))}
    </div>
  )
}
```

---

## 📝 Pages That Need Updating

### Priority 1: Remove Mock Data

#### 1. Main Homepage (`app/page.tsx`)

**Current**: Has hardcoded stores and categories  
**Lines 95-103**: Mock stores array  
**Solution**:

```typescript
// Replace mock data with API call
'use client'

import { useState, useEffect } from 'react'
import { productsAPI } from '@/lib/api-client'

export default function HomePage() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStores() {
      try {
        // Create an API endpoint for stores or use products
        const response = await fetch('/api/stores')
        const data = await response.json()
        setStores(data.stores || [])
      } catch (error) {
        console.error('Error fetching stores:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStores()
  }, [])

  // ... rest of component
}
```

#### 2. Driver Dashboard (`app/driver/page.tsx`)

**Current**: Likely has mock delivery data  
**Solution**:

```typescript
'use client'

import { useDriverDeliveries, useAcceptDelivery, useUpdateDeliveryStatus } from '@/hooks/use-api'

export default function DriverPage() {
  const { data, loading, error, refetch } = useDriverDeliveries()
  const { execute: acceptDelivery } = useAcceptDelivery()
  const { execute: updateStatus } = useUpdateDeliveryStatus()

  const handleAccept = async (orderId: string) => {
    try {
      await acceptDelivery(orderId)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateStatus(orderId, status)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      {data?.orders?.map(order => (
        <div key={order.id}>
          <h3>Order #{order.id}</h3>
          <button onClick={() => handleAccept(order.id)}>
            Accept
          </button>
          <button onClick={() => handleUpdateStatus(order.id, 'IN_DELIVERY')}>
            Start Delivery
          </button>
        </div>
      ))}
    </div>
  )
}
```

#### 3. Vendor Dashboard (`app/vendor/page.tsx`)

**Solution**:

```typescript
'use client'

import { useOrders, useUpdateOrderStatus } from '@/hooks/use-api'

export default function VendorPage() {
  const { data, loading, refetch } = useOrders()
  const { execute: updateStatus } = useUpdateOrderStatus()

  const handleStatusUpdate = async (orderId: string, status: string) => {
    try {
      await updateStatus(orderId, status)
      refetch()
    } catch (err) {
      console.error(err)
    }
  }

  // Vendor sees only their orders (filtered by backend)
  return (
    <div>
      {data?.orders?.map(order => (
        <div key={order.id}>
          <h3>Order #{order.id}</h3>
          <select onChange={(e) => handleStatusUpdate(order.id, e.target.value)}>
            <option value="ACCEPTED">Accept</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
          </select>
        </div>
      ))}
    </div>
  )
}
```

#### 4. Admin Dashboard (`app/admin/page.tsx`)

**Solution**:

```typescript
'use client'

import { useUsers, useRegistrationRequests, useProcessRegistrationRequest } from '@/hooks/use-api'

export default function AdminPage() {
  const { data: users, refetch: refetchUsers } = useUsers()
  const { data: requests, refetch: refetchRequests } = useRegistrationRequests({ status: 'PENDING' })
  const { execute: processRequest } = useProcessRegistrationRequest()

  const handleApprove = async (requestId: string) => {
    try {
      await processRequest(requestId, 'approve')
      refetchRequests()
      refetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <h2>Pending Registrations</h2>
      {requests?.registrationRequests?.map(req => (
        <div key={req.id}>
          <p>{req.name} - {req.role}</p>
          <button onClick={() => handleApprove(req.id)}>Approve</button>
          <button onClick={() => processRequest(req.id, 'reject')}>Reject</button>
        </div>
      ))}
    </div>
  )
}
```

---

## 🔔 Notifications Integration

### Update Header Component

```typescript
// components/Header.tsx
'use client'

import { useNotifications, useMarkNotificationRead } from '@/hooks/use-api'
import { Bell } from 'lucide-react'

export function Header() {
  const { data, refetch } = useNotifications(1, 10)
  const { execute: markRead } = useMarkNotificationRead()

  const unreadCount = data?.notifications?.filter(n => !n.isRead).length || 0

  const handleMarkRead = async (notificationId: string) => {
    await markRead([notificationId])
    refetch()
  }

  return (
    <header>
      <button className="relative">
        <Bell />
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>
      {/* Dropdown with notifications */}
    </header>
  )
}
```

---

## 💰 Wallet & Loyalty Integration

### Wallet Display

```typescript
'use client'

import { useWallet, useWalletTransactions } from '@/hooks/use-api'

export function WalletCard() {
  const { data: wallet, loading } = useWallet()

  if (loading) return <div>Loading...</div>

  return (
    <div className="wallet-card">
      <h3>Wallet Balance</h3>
      <p className="balance">{wallet?.wallet?.balance} DZD</p>
      <p>Total Spent: {wallet?.wallet?.totalSpent} DZD</p>
      <p>Total Earned: {wallet?.wallet?.totalEarned} DZD</p>
    </div>
  )
}
```

### Loyalty Display

```typescript
'use client'

import { useLoyaltyAccount, useLoyaltyRewards } from '@/hooks/use-api'

export function LoyaltyCard() {
  const { data: account } = useLoyaltyAccount()
  const { data: rewards } = useLoyaltyRewards()

  return (
    <div className="loyalty-card">
      <h3>Loyalty Points</h3>
      <p className="points">{account?.loyaltyAccount?.points} points</p>
      <p className="tier">Tier: {account?.loyaltyAccount?.tier}</p>
      
      <h4>Available Rewards</h4>
      {rewards?.rewards?.map(reward => (
        <div key={reward.id}>
          <p>{reward.name} - {reward.pointsCost} points</p>
        </div>
      ))}
    </div>
  )
}
```

---

## 🚗 Driver Location Integration

### Update Driver Location

```typescript
'use client'

import { useEffect } from 'react'
import { driverAPI } from '@/lib/api-client'

export function DriverLocationTracker({ orderId }: { orderId?: string }) {
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            await driverAPI.updateLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading || 0,
              speed: position.coords.speed || 0,
              isActive: true,
              status: 'online',
              currentOrderId: orderId,
            })
          } catch (error) {
            console.error('Failed to update location:', error)
          }
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, maximumAge: 10000 }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [orderId])

  return null
}
```

---

## 🎯 Error Handling Best Practices

### 1. Global Error Handler

```typescript
// lib/error-handler.ts
import { toast } from 'sonner'

export function handleAPIError(error: any) {
  if (error.statusCode === 401) {
    toast.error('Session expired. Please login again.')
    window.location.href = '/login'
  } else if (error.statusCode === 403) {
    toast.error('You do not have permission to perform this action.')
  } else if (error.statusCode === 404) {
    toast.error('Resource not found.')
  } else if (error.statusCode >= 500) {
    toast.error('Server error. Please try again later.')
  } else {
    toast.error(error.message || 'An error occurred.')
  }
}
```

### 2. Use in Components

```typescript
import { handleAPIError } from '@/lib/error-handler'

async function doSomething() {
  try {
    await someAPI.call()
  } catch (error) {
    handleAPIError(error)
  }
}
```

---

## 🧪 Testing Your Integration

### 1. Test Authentication Flow

```bash
# 1. Open http://localhost:3000/login
# 2. Login with: admin@albazdelivery.com / Admin123!
# 3. Verify you're redirected to homepage
# 4. Check browser console for any errors
```

### 2. Test API Calls

```typescript
// Add this temporarily to test
useEffect(() => {
  async function test() {
    console.log('Testing API...')
    const orders = await ordersAPI.list()
    console.log('Orders:', orders)
  }
  test()
}, [])
```

### 3. Check Network Tab

- Open DevTools → Network
- Filter by "Fetch/XHR"
- Verify API calls are being made
- Check status codes (should be 200 for success)
- Inspect responses

---

## 🔄 Real-time Updates (SSE)

### Subscribe to Order Updates

```typescript
'use client'

import { useSSE } from '@/lib/use-sse'

export function OrderTracker({ orderId }: { orderId: string }) {
  const { data: orderUpdate } = useSSE<any>('order-updated')

  useEffect(() => {
    if (orderUpdate && orderUpdate.id === orderId) {
      console.log('Order updated:', orderUpdate)
      // Update UI
    }
  }, [orderUpdate, orderId])

  return <div>Tracking order {orderId}...</div>
}
```

---

## ✅ Integration Checklist

### Phase 1: Core Functionality
- [x] API client created (`lib/api-client.ts`)
- [x] React hooks created (`hooks/use-api.ts`)
- [ ] Remove mock data from `app/page.tsx`
- [ ] Update driver dashboard (`app/driver/page.tsx`)
- [ ] Update vendor dashboard (`app/vendor/page.tsx`)
- [ ] Update admin dashboard (`app/admin/page.tsx`)

### Phase 2: Features
- [ ] Integrate wallet display in header
- [ ] Integrate loyalty points display
- [ ] Update notifications dropdown
- [ ] Add driver location tracking
- [ ] Add order status updates

### Phase 3: Polish
- [ ] Add loading skeletons
- [ ] Add error boundaries
- [ ] Add toast notifications
- [ ] Add optimistic updates
- [ ] Add data refresh intervals

---

## 📚 Quick Reference

### Common Patterns

#### Pattern 1: Fetch and Display
```typescript
const { data, loading, error } = useOrders()
if (loading) return <Spinner />
if (error) return <Error message={error} />
return <OrdersList orders={data.orders} />
```

#### Pattern 2: Action with Feedback
```typescript
const { execute, loading } = useCreateOrder()

const handleSubmit = async (formData) => {
  try {
    await execute(formData)
    toast.success('Order created!')
  } catch (err) {
    toast.error('Failed to create order')
  }
}

<Button onClick={handleSubmit} disabled={loading}>
  {loading ? 'Creating...' : 'Create Order'}
</Button>
```

#### Pattern 3: Real-time Updates
```typescript
const { data, refetch } = useOrders()

// Subscribe to SSE
const { data: newOrder } = useSSE('order-created')

useEffect(() => {
  if (newOrder) {
    refetch() // Refresh list
    toast.info('New order received!')
  }
}, [newOrder, refetch])
```

---

## 🚀 Next Steps

1. **Update Pages** - Replace mock data with API calls
2. **Test All Flows** - Login, create order, accept delivery, etc.
3. **Add Loading States** - Better UX during API calls
4. **Error Handling** - Global error handler + toast notifications
5. **Optimize** - Add caching, debouncing, pagination

---

## 💡 Tips

1. **Always use `useSession()`** to get current user data
2. **Use the hooks** (`use-api.ts`) instead of calling APIs directly
3. **Handle loading states** to improve UX
4. **Add error boundaries** to catch component errors
5. **Test with real data** from database, not mock data
6. **Check network tab** to debug API calls
7. **Use TypeScript** for type safety

---

## 🆘 Troubleshooting

### Issue: "Unauthorized" errors
**Solution**: Verify user is logged in with `useSession()`

### Issue: "CORS errors"
**Solution**: API and frontend must be on same domain (they are!)

### Issue: "Data not updating"
**Solution**: Call `refetch()` after mutations

### Issue: "Session not found"
**Solution**: Ensure middleware is protecting the route

---

**Happy coding! Your APIs are production-ready! 🎉**
