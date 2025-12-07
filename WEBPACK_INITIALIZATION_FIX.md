# Webpack Initialization Order Fix - Prevention Guide

## Problem
The error `ReferenceError: Cannot access 'tw' before initialization` occurs when webpack hoists or reorders module imports, causing variables to be accessed before they're initialized.

## Root Causes
1. **Webpack Module Hoisting**: Webpack may reorder module initialization during bundling
2. **Circular Dependencies**: Modules importing each other can cause initialization order issues
3. **Module Concatenation**: Webpack's module concatenation optimization can cause hoisting
4. **Direct Static Imports**: Importing `tailwind-merge` directly at module level can be hoisted

## Solution Pattern

### ✅ CORRECT: Runtime Module Access
```typescript
import { type ClassValue, clsx } from "clsx"

let twMergeCache: ReturnType<typeof import("tailwind-merge").twMerge> | null = null

function getTwMerge() {
  if (twMergeCache === null) {
    try {
      // Access at runtime, not during module evaluation
      const tailwindMergeModule = require("tailwind-merge")
      twMergeCache = tailwindMergeModule.twMerge || 
                     tailwindMergeModule.default?.twMerge || 
                     tailwindMergeModule.default
      if (!twMergeCache) {
        twMergeCache = ((...args: string[]) => args.join(" ")) as any
      }
    } catch (error) {
      twMergeCache = ((...args: string[]) => args.join(" ")) as any
    }
  }
  return twMergeCache
}

export function cn(...inputs: ClassValue[]) {
  return getTwMerge()(clsx(inputs))
}
```

### ❌ WRONG: Direct Static Import
```typescript
import { twMerge } from "tailwind-merge"  // ❌ Can be hoisted by webpack

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))  // ❌ May access before initialization
}
```

## Webpack Configuration

Add to `next.config.mjs` to prevent module initialization issues:

```javascript
webpack: (config, { isServer }) => {
  // ... other config ...
  
  config.optimization = {
    ...config.optimization,
    // Use deterministic module IDs for consistent ordering
    moduleIds: 'deterministic',
    // Disable module concatenation to prevent hoisting
    concatenateModules: false,
    // Mark all modules as having side effects to prevent aggressive tree-shaking
    // This ensures proper module initialization order
    // Note: sideEffects must be boolean or "flag", not a function
    sideEffects: true,
  }

  return config
}
```

## Best Practices

### 1. Use Runtime Requires for Critical Modules
- Use `require()` inside functions, not at module level
- Cache the result to avoid repeated requires
- Always include error handling and fallbacks

### 2. Avoid Circular Dependencies
- Keep imports unidirectional when possible
- Use dependency injection for shared utilities
- Consider using a shared package for common utilities

### 3. Use useMemo for Computed Values
Instead of:
```typescript
const value = expensiveCalculation()  // ❌ May be hoisted
```

Use:
```typescript
const value = useMemo(() => expensiveCalculation(), [dependencies])  // ✅ Safe
```

### 4. Mark Side Effects in Webpack
- Mark modules with initialization code as having side effects
- This prevents webpack from reordering or tree-shaking them

## Files Updated

All `utils.ts` files have been updated to use the robust pattern:
- ✅ `lib/utils.ts` (root)
- ✅ `apps/vendor/lib/utils.ts`
- ✅ `apps/customer/lib/utils.ts`
- ✅ `apps/admin/lib/utils.ts`
- ✅ `apps/driver/lib/utils.ts`
- ✅ `components/ui/lib/utils.ts`

## Testing

After making changes:
1. Clear build cache: `rm -rf .next` or `Remove-Item -Recurse -Force .next`
2. Restart dev server
3. Test in both development and production builds
4. Check browser console for any initialization errors

## Future Prevention

1. **Always use the runtime require pattern** for `tailwind-merge` and similar modules
2. **Test production builds** regularly, not just development
3. **Monitor for webpack warnings** about circular dependencies
4. **Use webpack bundle analyzer** to check module order if issues arise
5. **Document any new utility patterns** that might cause similar issues

## Related Issues

- Module initialization order problems
- Webpack hoisting and reordering
- Circular dependency warnings
- Production build failures with minified variable names

