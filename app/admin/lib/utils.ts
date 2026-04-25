import { type ClassValue, clsx } from "clsx"

/**
 * Utility for merging Tailwind CSS classes
 * Uses runtime require to prevent webpack hoisting issues
 */
type TwMergeFn = (input: string) => string

let twMergeCache: TwMergeFn | null = null

function getTwMerge(): TwMergeFn {
  if (twMergeCache === null) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const tailwindMergeModule = require("tailwind-merge")
      twMergeCache = tailwindMergeModule.twMerge || tailwindMergeModule.default?.twMerge || tailwindMergeModule.default
      if (!twMergeCache) {
        twMergeCache = (s: string) => s
      }
    } catch (error) {
      twMergeCache = (s: string) => s
    }
  }
  return twMergeCache ?? ((s: string) => s)
}

export function cn(...inputs: ClassValue[]) {
  return getTwMerge()(clsx(inputs))
}

