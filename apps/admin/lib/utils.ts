import { type ClassValue, clsx } from "clsx"

/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge with runtime require to avoid
 * initialization/hoisting issues.
 */
let twMergeCache: ((...args: any[]) => string) | null = null

function getTwMerge(): (...args: any[]) => string {
  if (twMergeCache === null) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const tailwindMergeModule = require("tailwind-merge")
      twMergeCache = tailwindMergeModule.twMerge || tailwindMergeModule.default?.twMerge || tailwindMergeModule.default

      if (!twMergeCache) {
        twMergeCache = ((...args: string[]) => args.join(" ")) as any
      }
    } catch (error) {
      twMergeCache = ((...args: string[]) => args.join(" ")) as any
    }
  }
  return twMergeCache!
}

export function cn(...inputs: ClassValue[]) {
  const merged = clsx(...inputs)
  return (getTwMerge() as any)(merged)
}

