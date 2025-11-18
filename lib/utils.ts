import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Ensure twMerge is properly initialized before use
const merge = twMerge

export function cn(...inputs: ClassValue[]) {
  return merge(clsx(inputs))
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100); // assuming amount is in cents
}
