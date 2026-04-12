import { type ClassValue, clsx } from "clsx"

/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 *
 * Uses runtime module access to prevent webpack circular dependency issues.
 */
type TwMergeFn = (input: string) => string

let twMergeCache: TwMergeFn | null = null

function getTwMerge(): TwMergeFn {
  if (twMergeCache === null) {
    try {
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
