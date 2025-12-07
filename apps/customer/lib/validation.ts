/**
 * Form validation utilities
 * Provides common validation functions for forms
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'L\'email est requis' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Format d\'email invalide' }
  }

  return { isValid: true }
}

/**
 * Phone number validation (Algerian format)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: 'Le numéro de téléphone est requis' }
  }

  // Remove spaces and special characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // Algerian phone number: +213 or 0 followed by 9 digits
  const phoneRegex = /^(\+213|0)[5-7]\d{8}$/
  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Format de numéro invalide. Utilisez le format algérien (ex: +213 555 123 456)',
    }
  }

  return { isValid: true }
}

/**
 * Password validation
 */
export function validatePassword(
  password: string,
  options: { minLength?: number; requireUppercase?: boolean; requireNumber?: boolean } = {}
): ValidationResult {
  const { minLength = 8, requireUppercase = true, requireNumber = true } = options

  if (!password) {
    return { isValid: false, error: 'Le mot de passe est requis' }
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Le mot de passe doit contenir au moins ${minLength} caractères`,
    }
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Le mot de passe doit contenir au moins une majuscule',
    }
  }

  if (requireNumber && !/\d/.test(password)) {
    return {
      isValid: false,
      error: 'Le mot de passe doit contenir au moins un chiffre',
    }
  }

  return { isValid: true }
}

/**
 * Required field validation
 */
export function validateRequired(value: string | number | null | undefined, fieldName: string): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} est requis` }
  }

  return { isValid: true }
}

/**
 * Minimum length validation
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationResult {
  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} doit contenir au moins ${minLength} caractères`,
    }
  }

  return { isValid: true }
}

/**
 * Maximum length validation
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} ne doit pas dépasser ${maxLength} caractères`,
    }
  }

  return { isValid: true }
}

/**
 * Number range validation
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  if (value < min || value > max) {
    return {
      isValid: false,
      error: `${fieldName} doit être entre ${min} et ${max}`,
    }
  }

  return { isValid: true }
}

/**
 * Positive number validation
 */
export function validatePositiveNumber(value: number, fieldName: string): ValidationResult {
  if (value <= 0) {
    return {
      isValid: false,
      error: `${fieldName} doit être un nombre positif`,
    }
  }

  return { isValid: true }
}

/**
 * Address validation
 */
export function validateAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'L\'adresse est requise' }
  }

  if (address.length < 10) {
    return {
      isValid: false,
      error: 'L\'adresse doit contenir au moins 10 caractères',
    }
  }

  return { isValid: true }
}

/**
 * City validation
 */
export function validateCity(city: string): ValidationResult {
  if (!city) {
    return { isValid: false, error: 'La ville est requise' }
  }

  return { isValid: true }
}

/**
 * Combine multiple validations
 */
export function validateAll(
  validations: ValidationResult[]
): ValidationResult {
  for (const validation of validations) {
    if (!validation.isValid) {
      return validation
    }
  }

  return { isValid: true }
}

/**
 * Create a validation function for a form field
 */
export function createFieldValidator(
  fieldName: string,
  ...validators: Array<(value: any) => ValidationResult>
) {
  return (value: any): ValidationResult => {
    return validateAll(validators.map((validator) => validator(value)))
  }
}

