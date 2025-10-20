import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  otpVerificationSchema,
} from '@/lib/validations/auth'
import { ZodError } from 'zod'

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '0551234567',
      password: 'Password123!',
      role: 'CUSTOMER' as const,
    }

    it('should validate correct registration data', () => {
      const result = registerSchema.safeParse(validData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('John Doe')
        expect(result.data.email).toBe('john@example.com')
      }
    })

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        ...validData,
        email: 'invalid-email',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email')
      }
    })

    it('should reject invalid Algerian phone number', () => {
      const invalidPhones = ['1234567890', '0441234567', '05512345'] // Wrong format

      invalidPhones.forEach((phone) => {
        const result = registerSchema.safeParse({
          ...validData,
          phone,
        })

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('Invalid Algerian phone')
        }
      })
    })

    it('should accept valid Algerian phone numbers', () => {
      const validPhones = ['0551234567', '0661234567', '0771234567']

      validPhones.forEach((phone) => {
        const result = registerSchema.safeParse({
          ...validData,
          phone,
        })

        expect(result.success).toBe(true)
      })
    })

    it('should reject weak password', () => {
      const weakPasswords = [
        'short', // Too short
        'alllowercase123', // No uppercase
        'ALLUPPERCASE123', // No lowercase
        'NoNumbers!', // No numbers
      ]

      weakPasswords.forEach((password) => {
        const result = registerSchema.safeParse({
          ...validData,
          password,
        })

        expect(result.success).toBe(false)
      })
    })

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        ...validData,
        name: 'A',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters')
      }
    })

    it('should accept valid roles', () => {
      const roles = ['CUSTOMER', 'VENDOR', 'DRIVER'] as const

      roles.forEach((role) => {
        const result = registerSchema.safeParse({
          ...validData,
          role,
        })

        expect(result.success).toBe(true)
      })
    })
  })

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid',
        password: 'password123',
      })

      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('changePasswordSchema', () => {
    const validData = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    }

    it('should validate correct password change data', () => {
      const result = changePasswordSchema.safeParse(validData)

      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const result = changePasswordSchema.safeParse({
        ...validData,
        confirmPassword: 'DifferentPassword123!',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("don't match")
      }
    })

    it('should reject weak new password', () => {
      const result = changePasswordSchema.safeParse({
        ...validData,
        newPassword: 'weak',
        confirmPassword: 'weak',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('otpVerificationSchema', () => {
    it('should validate correct OTP data', () => {
      const result = otpVerificationSchema.safeParse({
        phone: '0551234567',
        otp: '123456',
      })

      expect(result.success).toBe(true)
    })

    it('should reject OTP with wrong length', () => {
      const result = otpVerificationSchema.safeParse({
        phone: '0551234567',
        otp: '123', // Too short
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('6 digits')
      }
    })

    it('should reject invalid phone number', () => {
      const result = otpVerificationSchema.safeParse({
        phone: '1234567890',
        otp: '123456',
      })

      expect(result.success).toBe(false)
    })
  })
})
