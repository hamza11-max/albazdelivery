// API Cache Management
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes in milliseconds

export function getCachedData(key: string) {
  try {
    const cached = localStorage.getItem(`cache_${key}`)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(`cache_${key}`)
      return null
    }
    
    return data
  } catch (error) {
    console.error("[Cache] Error reading cached data:", error)
    return null
  }
}

export function setCachedData(key: string, data: any) {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error("[Cache] Error setting cached data:", error)
  }
}

export async function fetchWithCache(url: string, key: string) {
  try {
    // Try to get cached data first
    const cached = getCachedData(key)
    if (cached) {
      return { success: true, data: cached }
    }
    
    // If no cache or expired, fetch fresh data
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.success) {
      // Cache the successful response
      setCachedData(key, data.data)
    }
    
    return data
  } catch (error) {
    console.error("[Cache] Error fetching with cache:", error)
    // Return cached data if available, even if expired
    const cached = getCachedData(key)
    if (cached) {
      return { success: true, data: cached }
    }
    throw error
  }
}