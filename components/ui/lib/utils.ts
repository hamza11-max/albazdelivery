import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * This is a local copy to avoid module initialization issues
 * when components are imported across different apps
 * 
 * IMPORTANT: Keep imports at the top level and ensure this file
 * is imported before any component that uses cn() to prevent
 * "Cannot access 'tw' before initialization" errors
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

