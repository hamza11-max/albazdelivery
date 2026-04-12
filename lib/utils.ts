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
type TwMergeFn = (input: string) => string

let twMergeCache: TwMergeFn | null = null

function getTwMerge(): TwMergeFn {
  if (twMergeCache === null) {
    try {
      // Access the module at runtime, not during module evaluation
      // This prevents webpack from hoisting and creating circular dependencies
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const tailwindMergeModule = require("tailwind-merge") as {
        twMerge?: TwMergeFn
        default?: { twMerge?: TwMergeFn } | TwMergeFn
      }
      const candidate =
        tailwindMergeModule.twMerge ??
        (typeof tailwindMergeModule.default === "function"
          ? (tailwindMergeModule.default as TwMergeFn)
          : tailwindMergeModule.default?.twMerge)
      if (!candidate) {
        console.error("[utils] Failed to load tailwind-merge, falling back to clsx only")
        twMergeCache = (s: string) => s
      } else {
        twMergeCache = candidate
      }
    } catch (error) {
      console.error("[utils] Error loading tailwind-merge:", error)
      twMergeCache = (s: string) => s
    }
  }
  return twMergeCache
}

export function cn(...inputs: ClassValue[]) {
  const merged = clsx(inputs)
  return getTwMerge()(merged)
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // assuming amount is in cents
}
