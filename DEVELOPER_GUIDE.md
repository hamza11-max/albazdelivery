# Developer Guide - Best Practices & Utilities

Quick reference for developers working on the AL-baz delivery platform.

---

## 🏗️ Project Structure

```
albazdelivery/
├── apps/                      # Individual applications
│   ├── customer/             # Customer app (Port 3000)
│   ├── vendor/               # Vendor app (Port 3001)
│   ├── driver/               # Driver app (Port 3002)
│   └── admin/                # Admin app (Port 3003)
├── packages/                 # Shared packages
│   ├── ui/                   # UI components
│   ├── shared/               # Shared types & utilities
│   └── auth/                 # Auth utilities
├── lib/                      # Shared libraries
│   ├── utils/                # Utility functions
│   ├── validations/          # Zod schemas
│   └── security/             # Security utilities
├── components/               # Shared React components
└── prisma/                   # Database schema
```

---

## 🎨 Component Development

### 1. Creating New Components

**DO:**
```typescript
// Keep components small and focused
export function OrderCard({ order, onSelect }: OrderCardProps) {
  return (
    <Card onClick={() => onSelect(order)}>
      <OrderDetails order={order} />
    </Card>
  )
}
```

**DON'T:**
```typescript
// Avoid giant components with all logic inline
export function GiantComponent() {
  const [state1, setState1] = useState()
  const [state2, setState2] = useState()
  // ... 50 more state variables
  // ... 500 lines of logic
  return <div>...</div>
}
```

### 2. Using Error Boundaries

Wrap risky components:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function MyPage() {
  return (
    <ErrorBoundary>
      <ComponentThatMightError />
    </ErrorBoundary>
  )
}

// Or use HOC
import { withErrorBoundary } from '@/components/ErrorBoundary'
const SafeComponent = withErrorBoundary(RiskyComponent)
```

### 3. Component Props

Always define prop interfaces:

```typescript
interface MyComponentProps {
  title: string
  count: number
  onSubmit: (value: string) => void
  optional?: boolean
}

export function MyComponent({ title, count, onSubmit, optional }: MyComponentProps) {
  // ...
}
```

---

## 📝 Using Constants

### Business Rules

```typescript
import {
  DEFAULT_DELIVERY_FEE,
  MAX_ORDER_ITEMS,
  MIN_ORDER_VALUE,
  LOYALTY_POINTS_RATE,
} from '@/lib/constants'

// Instead of magic numbers
const fee = DEFAULT_DELIVERY_FEE  // ✅ Self-documenting
const fee = 500  // ❌ Magic number

// Validation
if (items.length > MAX_ORDER_ITEMS) {
  throw new ValidationError(`Maximum ${MAX_ORDER_ITEMS} items allowed`)
}

// Calculate points
const points = Math.floor(total * LOYALTY_POINTS_RATE)
```

### Phone Validation

```typescript
import { ALGERIAN_PHONE_REGEX } from '@/lib/constants'

if (!ALGERIAN_PHONE_REGEX.test(phone)) {
  throw new ValidationError('Invalid phone number')
}
```

---

## 🔍 Validation

### Email & Phone

```typescript
import { isValidEmail, isValidPhoneNumber, normalizeEmail } from '@/lib/utils/validation'

// Validate
if (!isValidEmail(email)) {
  return { error: 'Invalid email address' }
}

// Normalize before saving
const cleanEmail = normalizeEmail(email)  // lowercase, trimmed
```

### Password Strength

```typescript
import { validatePassword } from '@/lib/utils/validation'

const check = validatePassword(password)
if (!check.isValid) {
  return {
    error: 'Weak password',
    feedback: check.feedback, // ["Add uppercase letters", "Add numbers"]
  }
}
```

### Business Logic

```typescript
import { isValidOrderTotal, isValidAddress } from '@/lib/utils/validation'

// Validate order total matches calculation
if (!isValidOrderTotal(subtotal, deliveryFee, total, taxRate)) {
  throw new ValidationError('Order total mismatch')
}

// Validate address
if (!isValidAddress(deliveryAddress)) {
  throw new ValidationError('Invalid delivery address')
}
```

---

## 🎯 Formatting

### Dates

```typescript
import { formatDate, formatRelativeTime, formatShortDate } from '@/lib/utils/formatting'

// Localized date
formatDate(order.createdAt)  // "20 novembre 2024"
formatDate(order.createdAt, 'PPP', 'ar')  // Arabic format

// Relative time
formatRelativeTime(order.createdAt)  // "il y a 2 heures"

// Short date
formatShortDate(order.createdAt)  // "20/11/2024"
```

### Currency

```typescript
import { formatPrice } from '@/lib/utils/formatting'

formatPrice(1500)  // "1,500 DZD"
formatPrice(1500, false)  // "1,500" (no symbol)
```

### Phone Numbers

```typescript
import { formatPhoneNumber } from '@/lib/utils/formatting'

formatPhoneNumber('0567123456')  // "05 67 12 34 56"
formatPhoneNumber('+213567123456')  // "+213 5 67 12 34 56"
```

### Order Status

```typescript
import { formatOrderStatus, getOrderStatusColor } from '@/lib/utils/formatting'

// Get localized status text
formatOrderStatus('IN_DELIVERY', 'fr')  // "En Livraison"
formatOrderStatus('IN_DELIVERY', 'ar')  // "قيد التوصيل"

// Get badge color
const badgeColor = getOrderStatusColor('DELIVERED')  // "bg-green-500"
```

---

## 📊 Logging

### Basic Logging

```typescript
import { log } from '@/lib/utils/logger'

// Replace console.log
log.info('User action performed', { userId, action: 'login' })

// Replace console.error
log.error('Payment failed', error, { orderId, amount })

// Debug (only in development)
log.debug('State updated', { previousState, newState })

// Warning
log.warn('Suspicious activity detected', { ip, attemptCount })
```

### Specialized Loggers

```typescript
// Auth events
log.auth('User logged in', userId, { ip: request.ip })
log.auth('Failed login attempt', undefined, { email, ip })

// Order events
log.order('Order created', orderId, { customerId, total })
log.order('Order status updated', orderId, { oldStatus, newStatus })

// Payment events
log.payment('Payment initiated', orderId, amount, { method: 'stripe' })
log.payment('Payment completed', orderId, amount)

// API requests
log.api.request('POST', '/api/orders', { userId })
log.api.response('POST', '/api/orders', 201, { orderId })

// Database queries (only if ENABLE_QUERY_LOGGING=true)
log.db.query('SELECT', 'orders', { userId })
```

---

## 🚨 Error Handling

### Throwing Errors

```typescript
import { 
  ValidationError, 
  UnauthorizedError, 
  NotFoundError, 
  ConflictError 
} from '@/lib/errors'

// Validation errors
if (!isValid) {
  throw new ValidationError('Invalid input data')
}

// Authentication errors
if (!session) {
  throw new UnauthorizedError()  // Uses default message
}

// Not found
const user = await prisma.user.findUnique({ where: { id } })
if (!user) {
  throw new NotFoundError('User')  // "User not found"
}

// Conflicts
if (existingUser) {
  throw new ConflictError('Email already registered')
}
```

### API Route Pattern

```typescript
import { successResponse, errorResponse } from '@/lib/errors'
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    // 1. Apply rate limiting
    await applyRateLimit(request, rateLimitConfigs.api)

    // 2. Check authentication
    const session = await auth()
    if (!session) {
      throw new UnauthorizedError()
    }

    // 3. Validate input
    const body = await request.json()
    const validated = schema.parse(body)

    // 4. Business logic
    const result = await doSomething(validated)

    // 5. Return success
    return successResponse(result, 201)

  } catch (error) {
    // Automatic error formatting
    return errorResponse(error, undefined, request)
  }
}
```

---

## 🔐 Rate Limiting

### Apply to API Routes

```typescript
import { applyRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Choose appropriate config
  await applyRateLimit(request, rateLimitConfigs.auth)  // Strict for auth
  await applyRateLimit(request, rateLimitConfigs.api)   // Normal for API
  await applyRateLimit(request, rateLimitConfigs.strict) // Very restrictive
  await applyRateLimit(request, rateLimitConfigs.relaxed) // Lenient

  // Or custom config
  await applyRateLimit(request, {
    maxRequests: 50,
    windowMs: 60 * 1000, // 50 requests per minute
  })
}
```

### Rate Limit Configs

- `auth`: 5 requests / 15 minutes (login, register)
- `api`: 100 requests / minute (general API)
- `strict`: 10 requests / minute (sensitive operations)
- `relaxed`: 1000 requests / minute (read-only endpoints)

---

## 🧪 Testing

### Unit Tests

```typescript
import { formatPrice, validatePassword } from '@/lib/utils/...'

describe('formatPrice', () => {
  it('formats Algerian Dinar correctly', () => {
    expect(formatPrice(1500)).toBe('1,500 DZD')
  })
})
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import { OrderCard } from '@/components/OrderCard'

describe('OrderCard', () => {
  it('renders order details', () => {
    render(<OrderCard order={mockOrder} />)
    expect(screen.getByText('#ORD-123')).toBeInTheDocument()
  })
})
```

### API Tests

```typescript
import { POST } from '@/app/api/orders/route'

describe('POST /api/orders', () => {
  it('creates order successfully', async () => {
    const response = await POST(mockRequest)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
```

---

## 🌐 Internationalization

### Current Approach (Inline)

```typescript
const t = (key: string, fr: string, ar: string) => {
  return selectedLanguage === 'ar' ? ar : fr
}

// Usage
<h1>{t('welcome', 'Bienvenue', 'مرحبا')}</h1>
```

### Future Approach (next-intl) - Planned

```typescript
import { useTranslations } from 'next-intl'

const t = useTranslations('home')
<h1>{t('welcome')}</h1>  // Loads from messages/fr.json or messages/ar.json
```

---

## 🎨 Styling

### Tailwind Classes

Use semantic classes:

```typescript
// ✅ Good - semantic, theme-aware
<div className="bg-background text-foreground border-border">

// ❌ Avoid - hardcoded colors
<div className="bg-white text-black border-gray-200">
```

### Dark Mode Support

```typescript
// Tailwind handles this automatically with dark: prefix
<div className="bg-white dark:bg-gray-900">
<span className="text-gray-900 dark:text-gray-100">
```

---

## 🔑 Environment Variables

### Required for Development

```bash
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with-openssl-rand"
NEXTAUTH_URL="http://localhost:3000"
```

### Adding New Variables

1. Add to `ENV_TEMPLATE.md`
2. Document purpose and how to get value
3. Add validation in code if critical
4. Update deployment docs

---

## 📦 Working with Packages

### Using Shared UI Components

```typescript
import { Button, Card, Badge } from '@albaz/ui'

<Button variant="primary" size="lg">Click me</Button>
```

### Using Shared Types

```typescript
import type { Order, User, Product } from '@albaz/shared'

const order: Order = { ... }
```

### Using Shared Utilities

```typescript
import { formatPrice } from '@albaz/shared'
// Or from local lib
import { formatPrice } from '@/lib/utils/formatting'
```

---

## 🐛 Debugging

### Development Tools

```bash
# Enable query logging
ENABLE_QUERY_LOGGING=true npm run dev

# Check session
curl http://localhost:3000/api/debug/session

# Check environment
curl http://localhost:3000/api/debug/env

# Open Prisma Studio
npm run db:studio
```

### Logging Levels

```bash
# Set in .env
LOG_LEVEL=debug  # Show all logs
LOG_LEVEL=info   # Show info, warn, error
LOG_LEVEL=warn   # Show warn, error only
LOG_LEVEL=error  # Show errors only
```

---

## ⚡ Performance Tips

### 1. Use React.memo for Expensive Components

```typescript
import { memo } from 'react'

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // ... expensive rendering
})
```

### 2. Use useMemo for Expensive Calculations

```typescript
const filteredItems = useMemo(
  () => items.filter(item => item.category === selectedCategory),
  [items, selectedCategory]
)
```

### 3. Use useCallback for Event Handlers

```typescript
const handleClick = useCallback(
  (id: string) => {
    doSomething(id)
  },
  [doSomething]
)
```

---

## 🔒 Security Checklist

Before deploying:

- [ ] All API routes have rate limiting
- [ ] All inputs validated with Zod schemas
- [ ] No secrets in code (use environment variables)
- [ ] Authentication required for sensitive endpoints
- [ ] Error messages don't leak sensitive data
- [ ] CORS configured properly
- [ ] CSRF protection enabled

---

## 📱 Mobile Considerations

### Safe Area Insets

```typescript
// Use safe-area classes for mobile
<nav className="safe-area-bottom pb-safe">
  {/* Navigation content */}
</nav>
```

### Touch Targets

Minimum 44x44px for touch:

```typescript
<button className="min-h-[44px] min-w-[44px]">
  <Icon />
</button>
```

---

## 🚀 Deployment

### Pre-deployment Checklist

```bash
# 1. Run all tests
npm test

# 2. Type check
npm run type-check

# 3. Lint
cd apps/customer && npm run lint

# 4. Build all apps
npm run build

# 5. Check environment variables
# Verify all required vars are set in deployment platform
```

### Database Migrations

```bash
# Create migration
npm run db:migrate

# Deploy migrations
# Run in production:
npx prisma migrate deploy
```

---

## 🎓 Common Patterns

### Fetching Data

```typescript
const [data, setData] = useState<Order[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  async function fetchData() {
    try {
      setLoading(true)
      const response = await fetch('/api/orders')
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error?.message || 'Failed to load')
      }
    } catch (err) {
      setError('Network error')
      log.error('Failed to fetch orders', err)
    } finally {
      setLoading(false)
    }
  }
  
  fetchData()
}, [])
```

### Form Handling

```typescript
import { useState } from 'react'
import { validatePassword, isValidEmail } from '@/lib/utils/validation'

function RegisterForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!isValidEmail(email)) {
      newErrors.email = 'Invalid email'
    }

    const passwordCheck = validatePassword(password)
    if (!passwordCheck.isValid) {
      newErrors.password = passwordCheck.feedback.join(', ')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit form
    await submitForm()
  }
}
```

---

## 📖 Resources

### Internal Docs
- [TECHNICAL_DEBT_ANALYSIS.md](./TECHNICAL_DEBT_ANALYSIS.md) - Known issues
- [TECHNICAL_DEBT_FIXES_SUMMARY.md](./TECHNICAL_DEBT_FIXES_SUMMARY.md) - What's fixed
- [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) - Environment setup
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference

### External Links
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NextAuth.js](https://next-auth.js.org/)

---

## 💬 Getting Help

1. Check existing documentation (this file, README, etc.)
2. Search codebase for similar patterns
3. Check tests for usage examples
4. Review API documentation
5. Ask the team

---

## ✅ Code Review Checklist

Before submitting PR:

- [ ] Code follows project structure
- [ ] Uses constants instead of magic numbers
- [ ] Uses utility functions instead of duplicating logic
- [ ] Has proper TypeScript types (no `any`)
- [ ] Wrapped risky components in ErrorBoundary
- [ ] Uses structured logging (not console.log)
- [ ] API routes have rate limiting
- [ ] Input validation with Zod
- [ ] Tests written and passing
- [ ] No ESLint errors
- [ ] Documentation updated if needed

---

**Last Updated**: November 20, 2024  
**Maintainer**: Development Team  
**Questions?** Check docs or ask in team chat

