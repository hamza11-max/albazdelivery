import { type ClassValue, clsx } from "clsx"

/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * ROBUST SOLUTION: Uses runtime module access to prevent webpack
 * from creating circular dependencies or initialization order issues.
 * This pattern ensures tailwind-merge is only accessed when cn() is called,
 * not during module evaluation, preventing "Cannot access 'tw' before initialization" errors.
 * 
 * This approach:
 * 1. Prevents webpack hoisting issues
 * 2. Avoids circular dependency problems
 * 3. Works in both development and production builds
 * 4. Handles different module export formats
 * 5. Includes error handling and fallback
 */
// Use a permissive function type for the cached twMerge to avoid
// brittle inference from different module export shapes.
let twMergeCache: ((...args: any[]) => string) | null = null

function getTwMerge(): (...args: any[]) => string {
  if (twMergeCache === null) {
    try {
      // Access the module at runtime, not during module evaluation
      // This prevents webpack from hoisting and creating circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const tailwindMergeModule = require("tailwind-merge")
      twMergeCache = tailwindMergeModule.twMerge || tailwindMergeModule.default?.twMerge || tailwindMergeModule.default
      
      if (!twMergeCache) {
        console.error("[utils] Failed to load tailwind-merge, falling back to clsx only")
        // Fallback: return a function that just uses clsx
        twMergeCache = ((...args: string[]) => args.join(" ")) as any
      }
    } catch (error) {
      console.error("[utils] Error loading tailwind-merge:", error)
      // Fallback: return a function that just uses clsx
      twMergeCache = ((...args: string[]) => args.join(" ")) as any
    }
  }
  return twMergeCache!
}

export function cn(...inputs: ClassValue[]) {
  const merged = clsx(...inputs)
  // Call tailwind-merge while avoiding a TypeScript callable/type mismatch.
  // We assert as `any` here because runtime behavior is correct and the
  // types in this monorepo sometimes infer String objects for the module.
  return (getTwMerge() as any)(merged)
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // assuming amount is in cents
}
