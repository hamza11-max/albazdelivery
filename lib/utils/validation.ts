/**
 * Utility functions for data validation
 * Addresses technical debt: Repeated validation logic
 */

import { ALGERIAN_PHONE_REGEX, MIN_PASSWORD_LENGTH } from '../constants'

// ==============================================
// PHONE NUMBER VALIDATION
// ==============================================

/**
 * Validate Algerian phone number
 * Accepts formats: 0567123456, +213567123456
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '')
  return ALGERIAN_PHONE_REGEX.test(cleaned)
}

/**
 * Normalize phone number to standard format (+213...)
 */
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('213')) {
    return `+${cleaned}`
  }
  
  if (cleaned.startsWith('0')) {
    return `+213${cleaned.slice(1)}`
  }
  
  return phone
}

// ==============================================
// EMAIL VALIDATION
// ==============================================

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Normalize email (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

// ==============================================
// PASSWORD VALIDATION
// ==============================================

export interface PasswordStrength {
  isValid: boolean
  score: number // 0-5
  feedback: string[]
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): PasswordStrength {
  const feedback: string[] = []
  let score = 0

  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    feedback.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    return { isValid: false, score: 0, feedback }
  }

  score += 1

  // Check for lowercase
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }

  // Check for uppercase
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }

  // Check for numbers
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }

  // Check for special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters')
  }

  return {
    isValid: score >= 3,
    score,
    feedback: feedback.length > 0 ? feedback : ['Strong password!'],
  }
}

// ==============================================
// NUMERIC VALIDATION
// ==============================================

/**
 * Check if value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value)
}

/**
 * Check if value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

/**
 * Safely parse integer with default value
 */
export function parseIntSafe(value: string | undefined, defaultValue: number = 0): number {
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Safely parse float with default value
 */
export function parseFloatSafe(value: string | undefined, defaultValue: number = 0): number {
  if (!value) return defaultValue
  const parsed = parseFloat(value)
  return isNaN(parsed) ? defaultValue : parsed
}

// ==============================================
// STRING VALIDATION
// ==============================================

/**
 * Check if string is not empty (after trimming)
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Check if string matches minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.trim().length >= minLength
}

/**
 * Check if string matches maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.trim().length <= maxLength
}

/**
 * Sanitize string (remove HTML tags, trim)
 */
export function sanitizeString(value: string): string {
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

// ==============================================
// URL VALIDATION
// ==============================================

/**
 * Check if string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Check if URL is https
 */
export function isSecureUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// ==============================================
// FILE VALIDATION
// ==============================================

/**
 * Check if file type is allowed
 */
export function isAllowedFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * Check if file size is within limit
 */
export function isFileSizeValid(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes
}

// ==============================================
// COORDINATES VALIDATION
// ==============================================

/**
 * Check if coordinates are valid
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

// ==============================================
// BUSINESS LOGIC VALIDATION
// ==============================================

/**
 * Check if order total is valid
 */
export function isValidOrderTotal(
  subtotal: number,
  deliveryFee: number,
  total: number,
  taxRate: number = 0
): boolean {
  const expectedTotal = subtotal + deliveryFee + (subtotal * taxRate)
  const tolerance = 0.01 // Allow 1 cent difference due to rounding
  
  return Math.abs(expectedTotal - total) <= tolerance
}

/**
 * Check if quantity is valid
 */
export function isValidQuantity(quantity: number, maxQuantity?: number): boolean {
  if (!isPositiveNumber(quantity)) return false
  if (maxQuantity && quantity > maxQuantity) return false
  return true
}

/**
 * Validate address string
 */
export function isValidAddress(address: string): boolean {
  // Address should be at least 10 characters and contain numbers and letters
  return (
    address.trim().length >= 10 &&
    /\d/.test(address) &&
    /[a-zA-Z]/.test(address)
  )
}

// ==============================================
// TYPE GUARDS
// ==============================================

/**
 * Check if value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Check if value is a valid date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

