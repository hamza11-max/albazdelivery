import { z } from 'zod'

// Phone number validation for Algeria (starts with 05, 06, or 07, followed by 8 digits)
export const algerianPhoneRegex = /^0[567]\d{8}$/

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(algerianPhoneRegex, 'Invalid Algerian phone number (format: 05XXXXXXXX)'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['CUSTOMER', 'VENDOR', 'DRIVER']),
  licenseNumber: z.string().optional(),
  shopType: z.string().optional(),
  vehicleType: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
})

const loginIdentifierSchema = z
  .string()
  .trim()
  .min(1, 'Email or phone is required')
  .refine(
    (value) => value.includes('@') || algerianPhoneRegex.test(value),
    {
      message: 'Enter a valid email address or Algerian phone number',
    }
  )

export const loginSchema = z.object({
  identifier: loginIdentifierSchema,
  password: z.string().min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(algerianPhoneRegex).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export const otpVerificationSchema = z.object({
  phone: z.string().regex(algerianPhoneRegex),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type OTPVerificationInput = z.infer<typeof otpVerificationSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
