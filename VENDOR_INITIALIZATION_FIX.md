# Vendor App Initialization Error Fix - Complete Guide

## Problem
Persistent `ReferenceError: Cannot access 'sw' before initialization` error in production builds of the vendor app.

## Root Cause
Webpack's module bundling and minification can hoist or reorder variable declarations, causing variables to be accessed before they're initialized. The 'sw' is a minified variable name (likely 'subtotal' or similar).

## Complete Solution Applied

### 1. Removed ALL Variable Declarations from Cart Calculations

**Before (❌ Causes hoisting):**
```typescript
const cartSubtotal = useMemo(() => ..., [posCart])
const subtotal = posCart.reduce(...)
const total = subtotal - posDiscount
```

**After (✅ No hoisting possible):**
```typescript
// In JSX - direct computation, no variables
{(posCart.reduce((sum, item) => sum + item.price * item.quantity, 0)).toFixed(2)} DZD
{(posCart.reduce((sum, item) => sum + item.price * item.quantity, 0) - posDiscount).toFixed(2)} DZD

// In completeSale - computed inline in object
const requestBody = {
  subtotal: posCart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  total: posCart.reduce((sum, item) => sum + item.price * item.quantity, 0) - posDiscount,
  // ...
}
```

### 2. Fixed All utils.ts Files
All `utils.ts` files now use runtime `require()` pattern to prevent webpack hoisting:
- `lib/utils.ts`
- `apps/vendor/lib/utils.ts`
- `apps/customer/lib/utils.ts`
- `apps/admin/lib/utils.ts`
- `apps/driver/lib/utils.ts`
- `components/ui/lib/utils.ts`

### 3. Webpack Configuration
Updated `apps/vendor/next.config.mjs`:
```javascript
config.optimization = {
  moduleIds: 'deterministic',
  concatenateModules: false,  // Prevents hoisting
  sideEffects: true,          // Prevents tree-shaking
  usedExports: false,         // Disables export analysis
  providedExports: false,      // Disables import analysis
}
```

## Key Principles

1. **No Module-Level Variables for Computed Values**
   - Compute values inline where they're used
   - Use expressions, not variable declarations

2. **Runtime Module Access**
   - Use `require()` inside functions, not static imports
   - Cache results to avoid repeated requires

3. **Webpack Configuration**
   - Disable aggressive optimizations that cause hoisting
   - Mark modules as having side effects

## Files Modified

- ✅ `apps/vendor/app/vendor/page.tsx` - Removed all cart calculation variables
- ✅ `apps/vendor/lib/utils.ts` - Runtime require pattern
- ✅ `apps/vendor/next.config.mjs` - Anti-hoisting webpack config
- ✅ All other `utils.ts` files - Consistent pattern

## Testing

### Development
```bash
cd apps/vendor
npm run dev
# Visit http://localhost:3001
```

### Production Build
```bash
cd apps/vendor
npm run build
npm run start
# Test production build locally
```

### Deployment
If viewing on Vercel:
1. Push changes to GitHub
2. Wait for Vercel to rebuild
3. Hard refresh browser (Ctrl+Shift+R)

## If Error Persists

1. **Clear all caches:**
   ```bash
   Remove-Item -Recurse -Force .next
   Remove-Item -Recurse -Force node_modules/.cache
   npm run build
   ```

2. **Check browser cache:**
   - Hard refresh: Ctrl+Shift+R
   - Or DevTools → Network → Disable cache

3. **Verify you're viewing the latest build:**
   - Check build timestamp
   - Verify changes are committed and pushed
   - Check Vercel deployment logs

4. **Check for other sources:**
   - The 'sw' might be from a dependency
   - Check browser console for exact line number
   - Use source maps to identify the actual variable

## Prevention

- Always compute values inline when possible
- Use runtime require for critical modules
- Test production builds regularly
- Monitor webpack bundle for hoisting warnings

