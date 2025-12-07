/**
 * Test utilities for API route testing
 */

import { NextRequest } from 'next/server'

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {} } = options

  // Create a URL object to handle searchParams
  const urlObj = new URL(url, 'http://localhost:3000')
  
  // Create request body if provided
  const bodyString = body ? JSON.stringify(body) : undefined

  // Create a proper Request object
  const baseRequest = new Request(urlObj.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: bodyString,
  })
  
  // Create a mock NextRequest object
  const request = {
    ...baseRequest,
    // Override json() method to return parsed body
    json: async () => {
      if (!bodyString) {
        return {}
      }
      try {
        return JSON.parse(bodyString)
      } catch {
        return {}
      }
    },
    // Add NextRequest-specific properties
    // Create a proper nextUrl object that matches Next.js NextURL
    nextUrl: {
      searchParams: urlObj.searchParams,
      pathname: urlObj.pathname,
      href: urlObj.href,
      origin: urlObj.origin,
      protocol: urlObj.protocol,
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      search: urlObj.search,
      hash: urlObj.hash,
      toString: () => urlObj.toString(),
      clone: function() {
        return this
      },
    },
    // Add URL property for compatibility
    url: urlObj.toString(),
    // Preserve Request properties
    method: method,
    headers: baseRequest.headers,
    // Add other Request methods
    clone: baseRequest.clone.bind(baseRequest),
    arrayBuffer: baseRequest.arrayBuffer.bind(baseRequest),
    blob: baseRequest.blob.bind(baseRequest),
    formData: baseRequest.formData.bind(baseRequest),
    text: baseRequest.text.bind(baseRequest),
  } as any

  return request as NextRequest
}

/**
 * Generate a valid CUID for testing
 * CUIDs start with 'c' followed by 24 alphanumeric characters
 */
export function generateCuid(prefix = 'c'): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const randomPart = Array.from({ length: 24 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  return `${prefix}${randomPart}`
}

/**
 * Create multiple CUIDs for testing
 */
export function generateCuidArray(count: number, prefix = 'c'): string[] {
  return Array.from({ length: count }, () => generateCuid(prefix))
}

