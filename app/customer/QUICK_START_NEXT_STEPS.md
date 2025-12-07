# Quick Start - Next Steps

## 🎯 Start Here (30 minutes)

### 1. Migrate Order Placement (15 min)
Replace manual fetch with React Query hook:

```typescript
// In app/page.tsx
import { useCreateOrder } from '../hooks/use-orders-mutation'

// Replace placeOrder function:
const createOrder = useCreateOrder()

const placeOrder = async () => {
  try {
    const result = await createOrder.mutateAsync({
      storeId: selectedStore!,
      items: cart.map((item) => {
        const prod = products.find((p) => String(p.id) === String(item.productId))
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: prod?.price || 0,
        }
      }),
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      paymentMethod,
      deliveryAddress: '123 Rue Example, Appartement 4',
      city: selectedCity,
      customerPhone: '+213555000000',
    })

    if (result?.order) {
      setOrderId(result.order.id)
      setCurrentOrder(result.order)
      setCurrentPage('tracking')
      setCart([])
    }
  } catch (error) {
    // Error already handled by hook
  }
}
```

### 2. Add React.memo (10 min)
Quick performance boost:

```typescript
// components/views/HomePage.tsx
import React from 'react'

export const HomePage = React.memo(function HomePage({ ... }: HomePageProps) {
  // ... existing code
})
```

### 3. Add ARIA Labels (5 min)
Quick accessibility win:

```typescript
// Add to buttons
<button aria-label="Add to cart">...</button>
<button aria-label="Back to home">...</button>
```

---

## 📋 This Week Checklist

- [ ] Migrate order placement
- [ ] Add React.memo to 3 main views
- [ ] Replace <img> with next/image
- [ ] Add basic ARIA labels
- [ ] Set up testing infrastructure

---

**Ready?** Start with step 1 above! 🚀

