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
let twMergeCache: ReturnType<typeof import("tailwind-merge").twMerge> | null = null

function getTwMerge() {
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
  return twMergeCache
}

export function cn(...inputs: ClassValue[]) {
  const merged = clsx(inputs)
  const twMerge = getTwMerge()
  return twMerge(merged)
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // assuming amount is in cents
}
