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
      twMergeCache = candidate ?? ((s: string) => s)
    } catch {
      twMergeCache = (s: string) => s
    }
  }
  return twMergeCache
}

export function cn(...inputs: ClassValue[]) {
  return getTwMerge()(clsx(inputs))
}

