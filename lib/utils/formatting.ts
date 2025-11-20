/**
 * Utility functions for formatting data
 * Addresses technical debt: Repeated logic across components
 */

import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { fr, ar } from 'date-fns/locale'

// ==============================================
// DATE FORMATTING
// ==============================================

export type SupportedLocale = 'fr' | 'ar' | 'en'

/**
 * Format a date to localized string
 * @param date - Date to format
 * @param formatStr - Format string (default: 'PPP')
 * @param locale - Locale code
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'PPP',
  locale: SupportedLocale = 'fr'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const localeMap = { fr, ar, en: undefined }
  
  return format(dateObj, formatStr, {
    locale: localeMap[locale],
  })
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @param locale - Locale code
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: Date | string,
  locale: SupportedLocale = 'fr'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const localeMap = { fr, ar, en: undefined }
  
  return formatDistanceToNow(dateObj, {
    addSuffix: true,
    locale: localeMap[locale],
  })
}

/**
 * Format date as short date (DD/MM/YYYY)
 */
export function formatShortDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd/MM/yyyy')
}

/**
 * Format date with time (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'dd/MM/yyyy HH:mm')
}

// ==============================================
// CURRENCY FORMATTING
// ==============================================

/**
 * Format price in Algerian Dinar
 * @param amount - Amount in DZD (smallest unit)
 * @param showSymbol - Whether to show currency symbol
 * @returns Formatted price string
 */
export function formatPrice(amount: number, showSymbol: boolean = true): string {
  const formatted = new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)

  return showSymbol ? `${formatted} DZD` : formatted
}

/**
 * Format price for display with proper spacing
 */
export function formatPriceCompact(amount: number): string {
  return `${amount} DZD`
}

// ==============================================
// PHONE NUMBER FORMATTING
// ==============================================

/**
 * Format Algerian phone number
 * @param phone - Phone number (with or without country code)
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Handle different formats
  if (digits.startsWith('213')) {
    // +213 format
    const local = digits.slice(3)
    return `+213 ${local.slice(0, 1)} ${local.slice(1, 3)} ${local.slice(3, 5)} ${local.slice(5, 7)} ${local.slice(7)}`
  } else if (digits.startsWith('0')) {
    // 0X XX XX XX XX format
    return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
  }

  return phone
}

/**
 * Validate Algerian phone number
 */
export function isValidAlgerianPhone(phone: string): boolean {
  const regex = /^(0|\+213)[567]\d{8}$/
  return regex.test(phone.replace(/\s/g, ''))
}

// ==============================================
// TEXT FORMATTING
// ==============================================

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 */
export function truncate(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitle(text: string): string {
  return titleCase(text.replace(/_/g, ' '))
}

// ==============================================
// ORDER STATUS FORMATTING
// ==============================================

export type OrderStatusType = 
  | 'PENDING' 
  | 'ACCEPTED' 
  | 'PREPARING' 
  | 'READY' 
  | 'ASSIGNED' 
  | 'IN_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED'

/**
 * Get badge color class for order status
 */
export function getOrderStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'bg-yellow-500',
    ACCEPTED: 'bg-blue-400',
    PREPARING: 'bg-blue-500',
    READY: 'bg-purple-500',
    ASSIGNED: 'bg-indigo-500',
    IN_DELIVERY: 'bg-blue-600',
    DELIVERED: 'bg-green-500',
    CANCELLED: 'bg-red-500',
  }

  return statusMap[status] || 'bg-gray-500'
}

/**
 * Get human-readable order status text
 */
export function formatOrderStatus(status: string, locale: SupportedLocale = 'fr'): string {
  const statusMap: Record<string, Record<SupportedLocale, string>> = {
    PENDING: { fr: 'En Attente', ar: 'قيد الانتظار', en: 'Pending' },
    ACCEPTED: { fr: 'Acceptée', ar: 'مقبولة', en: 'Accepted' },
    PREPARING: { fr: 'En Préparation', ar: 'قيد التحضير', en: 'Preparing' },
    READY: { fr: 'Prête', ar: 'جاهزة', en: 'Ready' },
    ASSIGNED: { fr: 'Assignée', ar: 'مخصصة', en: 'Assigned' },
    IN_DELIVERY: { fr: 'En Livraison', ar: 'قيد التوصيل', en: 'In Delivery' },
    DELIVERED: { fr: 'Livrée', ar: 'تم التوصيل', en: 'Delivered' },
    CANCELLED: { fr: 'Annulée', ar: 'ملغاة', en: 'Cancelled' },
  }

  return statusMap[status]?.[locale] || status
}

// ==============================================
// RATING FORMATTING
// ==============================================

/**
 * Format rating with star emoji
 */
export function formatRating(rating: number): string {
  const stars = '⭐'.repeat(Math.floor(rating))
  const decimal = rating % 1
  return decimal >= 0.5 ? `${stars}½` : stars
}

/**
 * Calculate percentage rating (out of 5)
 */
export function ratingToPercentage(rating: number): number {
  return (rating / 5) * 100
}

// ==============================================
// DISTANCE FORMATTING
// ==============================================

/**
 * Format distance in kilometers
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

// ==============================================
// PERCENTAGE FORMATTING
// ==============================================

/**
 * Format number as percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`
}

// ==============================================
// FILE SIZE FORMATTING
// ==============================================

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

