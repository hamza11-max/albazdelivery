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
let twMergeCache: ((input: string) => string) | null = null

function getTwMerge(): (input: string) => string {
  if (twMergeCache === null) {
    try {
      // Access the module at runtime, not during module evaluation
      // This prevents webpack from hoisting and creating circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const tailwindMergeModule = require("tailwind-merge")
      // tailwind-merge exports a function named `twMerge`. If module uses default export,
      // normalize to a function. We expect a function of signature (input: string) => string.
      const candidate = tailwindMergeModule.twMerge || tailwindMergeModule.default?.twMerge || tailwindMergeModule.default
      if (typeof candidate === 'function') {
        twMergeCache = candidate
      } else {
        console.error("[utils] Failed to load tailwind-merge, falling back to clsx-only merger")
        // Fallback: function that returns the string unchanged (clsx already merged)
        twMergeCache = (s: string) => String(s)
      }
    } catch (error) {
      console.error("[utils] Error loading tailwind-merge:", error)
      // Fallback: return identity function
      twMergeCache = (s: string) => String(s)
    }
  }
  // At this point twMergeCache is guaranteed to be a function
  return twMergeCache!
}

export function cn(...inputs: ClassValue[]) {
  const merged = clsx(...inputs)
  const twMerge = getTwMerge()
  return twMerge(String(merged))
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // assuming amount is in cents
}
