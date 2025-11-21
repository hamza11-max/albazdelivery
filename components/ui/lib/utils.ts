import { type ClassValue, clsx } from "clsx"

/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * This is a local copy to avoid module initialization issues
 * when components are imported across different apps
 * 
 * Uses a function-scoped import to prevent webpack from hoisting
 * and causing "Cannot access 'tw' before initialization" errors
 */
function getTwMerge() {
  // Import inside function to prevent hoisting and ensure proper initialization order
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const tailwindMerge = require("tailwind-merge")
  return tailwindMerge.twMerge || tailwindMerge.default?.twMerge || tailwindMerge.default
}

export function cn(...inputs: ClassValue[]) {
  return getTwMerge()(clsx(inputs))
}

