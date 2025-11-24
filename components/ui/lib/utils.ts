import { type ClassValue, clsx } from "clsx"

/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * FINAL SOLUTION: Uses runtime module access to prevent webpack
 * from creating circular dependencies or initialization order issues.
 * This pattern ensures tailwind-merge is only accessed when cn() is called,
 * not during module evaluation, preventing "Cannot access 'tw' before initialization" errors.
 */
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
        twMergeCache = ((...args: string[]) => args.join(" ")) as any
      }
    } catch (error) {
      // Fallback: return a function that just uses clsx
      twMergeCache = ((...args: string[]) => args.join(" ")) as any
    }
  }
  return twMergeCache!
}

export function cn(...inputs: ClassValue[]) {
  return getTwMerge()(clsx(...inputs))
}

