import { describe, it, expect, beforeEach } from '@jest/globals'
import { getSecurityHeaders, applySecurityHeaders, getCorsHeaders } from '@/lib/security/headers'
import { NextResponse } from 'next/server'

describe('Security Headers', () => {
  const originalEnv = process.env.NODE_ENV

  afterEach(() => {
    // Use Object.defineProperty to bypass readonly restriction
    Object.defineProperty(process, 'env', {
      value: { ...process.env, NODE_ENV: originalEnv },
      writable: true,
      configurable: true,
    })
  })

  describe('getSecurityHeaders', () => {
    it('should return security headers', () => {
      const headers = getSecurityHeaders()
      expect(headers).toBeDefined()
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    })

    it('should include CSP in production', () => {
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: 'production' },
        writable: true,
        configurable: true,
      })
      const headers = getSecurityHeaders()
      expect(headers['Content-Security-Policy']).toBeDefined()
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'")
    })

    it('should include CSP in development', () => {
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: 'development' },
        writable: true,
        configurable: true,
      })
      const headers = getSecurityHeaders()
      expect(headers['Content-Security-Policy']).toBeDefined()
    })

    it('should include HSTS in production', () => {
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: 'production' },
        writable: true,
        configurable: true,
      })
      const headers = getSecurityHeaders()
      expect(headers['Strict-Transport-Security']).toBeDefined()
      expect(headers['Strict-Transport-Security']).toContain('max-age=31536000')
    })

    it('should not include HSTS in development', () => {
      Object.defineProperty(process, 'env', {
        value: { ...process.env, NODE_ENV: 'development' },
        writable: true,
        configurable: true,
      })
      const headers = getSecurityHeaders()
      expect(headers['Strict-Transport-Security']).toBeUndefined()
    })

    it('should include Permissions-Policy', () => {
      const headers = getSecurityHeaders()
      expect(headers['Permissions-Policy']).toBeDefined()
      expect(headers['Permissions-Policy']).toContain('camera=()')
      expect(headers['Permissions-Policy']).toContain('microphone=()')
    })
  })

  describe('applySecurityHeaders', () => {
    it('should apply security headers to response', () => {
      const response = NextResponse.next()
      const modifiedResponse = applySecurityHeaders(response)
      
      expect(modifiedResponse.headers.get('X-Frame-Options')).toBe('DENY')
      expect(modifiedResponse.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(modifiedResponse.headers.get('X-XSS-Protection')).toBe('1; mode=block')
    })

    it('should not modify the original response object', () => {
      const response = NextResponse.next()
      const originalHeaders = Array.from(response.headers.entries())
      applySecurityHeaders(response)
      // Headers should be modified
      expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    })
  })

  describe('getCorsHeaders', () => {
    it('should return CORS headers', () => {
      const headers = getCorsHeaders()
      expect(headers).toBeDefined()
      expect(headers['Access-Control-Allow-Methods']).toBeDefined()
      expect(headers['Access-Control-Allow-Headers']).toBeDefined()
      expect(headers['Access-Control-Allow-Credentials']).toBe('true')
    })

    it('should include allowed methods', () => {
      const headers = getCorsHeaders()
      const methods = headers['Access-Control-Allow-Methods']
      expect(methods).toContain('GET')
      expect(methods).toContain('POST')
      expect(methods).toContain('PUT')
      expect(methods).toContain('DELETE')
    })

    it('should include required headers', () => {
      const headers = getCorsHeaders()
      const allowedHeaders = headers['Access-Control-Allow-Headers']
      expect(allowedHeaders).toContain('Content-Type')
      expect(allowedHeaders).toContain('Authorization')
      expect(allowedHeaders).toContain('X-CSRF-Token')
    })
  })
})

