import { type ClassValue, clsx } from "clsx"

/**
 * Utility for merging Tailwind CSS classes
 * Uses runtime require to prevent webpack hoisting issues
 */
let twMergeCache: ReturnType<typeof import("tailwind-merge").twMerge> | null = null

function getTwMerge() {
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
  return twMergeCache
}

export function cn(...inputs: ClassValue[]) {
  return getTwMerge()(clsx(inputs))
}
