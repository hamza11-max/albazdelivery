import { hashPassword, verifyPassword, generateRandomPassword } from '@/lib/password'

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(50)
    })

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword123!'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })
  })

  describe('generateRandomPassword', () => {
    it('should generate password of specified length', () => {
      const password = generateRandomPassword(16)

      expect(password).toBeDefined()
      expect(password.length).toBe(16)
    })

    it('should generate password with default length', () => {
      const password = generateRandomPassword()

      expect(password).toBeDefined()
      expect(password.length).toBe(12)
    })

    it('should contain uppercase letters', () => {
      const password = generateRandomPassword()

      expect(/[A-Z]/.test(password)).toBe(true)
    })

    it('should contain lowercase letters', () => {
      const password = generateRandomPassword()

      expect(/[a-z]/.test(password)).toBe(true)
    })

    it('should contain numbers', () => {
      const password = generateRandomPassword()

      expect(/[0-9]/.test(password)).toBe(true)
    })

    it('should contain special characters', () => {
      const password = generateRandomPassword()

      expect(/[!@#$%^&*]/.test(password)).toBe(true)
    })

    it('should generate different passwords', () => {
      const password1 = generateRandomPassword()
      const password2 = generateRandomPassword()

      expect(password1).not.toBe(password2)
    })
  })
})
