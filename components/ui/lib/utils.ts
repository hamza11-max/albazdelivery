import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility for merging Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * This is a local copy to avoid module initialization issues
 * when components are imported across different apps
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

