import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { generateCsrfToken, validateCsrfToken, constantTimeCompare } from '@/lib/security/csrf'
import { NextRequest } from 'next/server'

describe('CSRF Protection', () => {
  describe('generateCsrfToken', () => {
    it('should generate a token', () => {
      const token = generateCsrfToken()
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken()
      const token2 = generateCsrfToken()
      expect(token1).not.toBe(token2)
    })

    it('should generate tokens of consistent length', () => {
      const tokens = Array.from({ length: 10 }, () => generateCsrfToken())
      const lengths = tokens.map(t => t.length)
      const uniqueLengths = new Set(lengths)
      expect(uniqueLengths.size).toBe(1) // All tokens should have the same length
    })
  })

  describe('constantTimeCompare', () => {
    it('should return true for identical strings', () => {
      const str = 'test-string'
      expect(constantTimeCompare(str, str)).toBe(true)
    })

    it('should return false for different strings', () => {
      expect(constantTimeCompare('string1', 'string2')).toBe(false)
    })

    it('should return false for strings of different lengths', () => {
      expect(constantTimeCompare('short', 'much-longer-string')).toBe(false)
    })

    it('should handle empty strings', () => {
      expect(constantTimeCompare('', '')).toBe(true)
      expect(constantTimeCompare('', 'non-empty')).toBe(false)
    })
  })

  describe('validateCsrfToken', () => {
    // Mock NextRequest for testing
    const createMockRequest = (method: string, headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
      const mockRequest = {
        method: method.toUpperCase(),
        headers: {
          get: (name: string) => headers[name] || null,
        },
        cookies: {
          get: (name: string) => {
            const value = cookies[name]
            return value ? { value } : undefined
          },
        },
      } as unknown as NextRequest
      return mockRequest
    }

    it('should return true for GET requests', () => {
      const request = createMockRequest('GET')
      expect(validateCsrfToken(request)).toBe(true)
    })

    it('should return true for HEAD requests', () => {
      const request = createMockRequest('HEAD')
      expect(validateCsrfToken(request)).toBe(true)
    })

    it('should return true for OPTIONS requests', () => {
      const request = createMockRequest('OPTIONS')
      expect(validateCsrfToken(request)).toBe(true)
    })

    it('should return false for POST requests without tokens', () => {
      const request = createMockRequest('POST')
      expect(validateCsrfToken(request)).toBe(false)
    })

    it('should return false when tokens do not match', () => {
      const token = generateCsrfToken()
      const request = createMockRequest('POST', {
        'X-CSRF-Token': token,
      }, {
        '__Host-csrf-token': 'different-token',
      })
      expect(validateCsrfToken(request)).toBe(false)
    })

    it('should return true when tokens match', () => {
      const token = generateCsrfToken()
      const request = createMockRequest('POST', {
        'X-CSRF-Token': token,
      }, {
        '__Host-csrf-token': token,
      })
      expect(validateCsrfToken(request)).toBe(true)
    })
  })
})

