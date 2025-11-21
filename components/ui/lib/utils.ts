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
let twMergeCache: ReturnType<typeof import("tailwind-merge").twMerge> | null = null

function getTwMerge() {
  if (twMergeCache === null) {
    // Access the module at runtime, not during module evaluation
    // This prevents webpack from hoisting and creating circular dependencies
    const tailwindMergeModule = require("tailwind-merge")
    twMergeCache = tailwindMergeModule.twMerge || tailwindMergeModule.default?.twMerge || tailwindMergeModule.default
  }
  return twMergeCache
}

export function cn(...inputs: ClassValue[]) {
  return getTwMerge()(clsx(inputs))
}

