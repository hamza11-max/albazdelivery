import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * CRITICAL: This file must be imported BEFORE any component that uses cn()
 * to prevent "Cannot access 'tw' before initialization" errors.
 * The import order is enforced by webpack chunk configuration.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

