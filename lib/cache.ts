/**
 * Cache utilities for performance optimization and ISR (Incremental Static Regeneration)
 */

/**
 * Cache configuration interface
 */
export interface CacheConfig {
  ttl: number // Time to live in seconds
  staleWhileRevalidate?: number // Additional time to serve stale content while revalidating
  maxAge?: number // Browser cache max age
  sMaxAge?: number // CDN cache max age
}

/**
 * Predefined cache configurations for different data types
 */
export const CACHE_CONFIGS = {
  // Provider data changes rarely
  PROVIDERS: {
    ttl: 24 * 60 * 60, // 24 hours
    staleWhileRevalidate: 7 * 24 * 60 * 60, // 7 days
    maxAge: 60 * 60, // 1 hour browser cache
    sMaxAge: 24 * 60 * 60, // 24 hours CDN cache
  } as CacheConfig,

  // GPU pricing data updates every 6 hours
  PRICING: {
    ttl: 6 * 60 * 60, // 6 hours
    staleWhileRevalidate: 24 * 60 * 60, // 24 hours
    maxAge: 30 * 60, // 30 minutes browser cache
    sMaxAge: 6 * 60 * 60, // 6 hours CDN cache
  } as CacheConfig,

  // Comparison data combines provider and pricing data
  COMPARISON: {
    ttl: 6 * 60 * 60, // 6 hours (same as pricing)
    staleWhileRevalidate: 24 * 60 * 60, // 24 hours
    maxAge: 30 * 60, // 30 minutes browser cache
    sMaxAge: 6 * 60 * 60, // 6 hours CDN cache
  } as CacheConfig,

  // Static metadata changes very rarely
  METADATA: {
    ttl: 7 * 24 * 60 * 60, // 7 days
    staleWhileRevalidate: 30 * 24 * 60 * 60, // 30 days
    maxAge: 24 * 60 * 60, // 24 hours browser cache
    sMaxAge: 7 * 24 * 60 * 60, // 7 days CDN cache
  } as CacheConfig,

  // Frequently changing content
  DYNAMIC: {
    ttl: 5 * 60, // 5 minutes
    staleWhileRevalidate: 30 * 60, // 30 minutes
    maxAge: 60, // 1 minute browser cache
    sMaxAge: 5 * 60, // 5 minutes CDN cache
  } as CacheConfig,
} as const

/**
 * In-memory cache implementation with TTL support
 */
export class MemoryCache {
  private cache = new Map<string, {
    data: any
    timestamp: number
    ttl: number
  }>()

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    const now = Date.now()
    const isExpired = (now - item.timestamp) > (item.ttl * 1000)
    
    if (isExpired) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds
    })
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean expired items from cache
   */
  cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []
    
    this.cache.forEach((item, key) => {
      const isExpired = (now - item.timestamp) > (item.ttl * 1000)
      if (isExpired) {
        expiredKeys.push(key)
      }
    })
    
    expiredKeys.forEach(key => this.cache.delete(key))
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    const keys: string[] = []
    this.cache.forEach((_, key) => keys.push(key))
    
    return {
      size: this.cache.size,
      keys
    }
  }
}

/**
 * Global memory cache instances
 */
export const providerCache = new MemoryCache()
export const pricingCache = new MemoryCache()
export const comparisonCache = new MemoryCache()

/**
 * Generate cache key for provider data
 */
export function getProviderCacheKey(slug: string): string {
  return `provider:${slug.toLowerCase()}`
}

/**
 * Generate cache key for pricing data
 */
export function getPricingCacheKey(provider1Id: string, provider2Id: string): string {
  // Sort IDs to ensure consistent cache keys regardless of parameter order
  const sortedIds = [provider1Id, provider2Id].sort()
  return `pricing:${sortedIds[0]}:${sortedIds[1]}`
}

/**
 * Generate cache key for comparison data
 */
export function getComparisonCacheKey(provider1Slug: string, provider2Slug: string): string {
  // Sort slugs to ensure consistent cache keys regardless of parameter order
  const sortedSlugs = [provider1Slug.toLowerCase(), provider2Slug.toLowerCase()].sort()
  return `comparison:${sortedSlugs[0]}:${sortedSlugs[1]}`
}

/**
 * Generate cache headers for HTTP responses
 */
export function generateCacheHeaders(config: CacheConfig): Record<string, string> {
  const headers: Record<string, string> = {}
  
  // Cache-Control header for browser and CDN caching
  const cacheControl = []
  
  if (config.maxAge) {
    cacheControl.push(`max-age=${config.maxAge}`)
  }
  
  if (config.sMaxAge) {
    cacheControl.push(`s-maxage=${config.sMaxAge}`)
  }
  
  if (config.staleWhileRevalidate) {
    cacheControl.push(`stale-while-revalidate=${config.staleWhileRevalidate}`)
  }
  
  // Add public directive for CDN caching
  cacheControl.push('public')
  
  headers['Cache-Control'] = cacheControl.join(', ')
  
  // Add ETag for conditional requests
  headers['ETag'] = `"${Date.now()}"`
  
  return headers
}

/**
 * Cached function wrapper with memory cache
 */
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  getCacheKey: (...args: T) => string,
  cache: MemoryCache,
  ttlSeconds: number
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const cacheKey = getCacheKey(...args)
    
    // Try to get from cache first
    const cached = cache.get<R>(cacheKey)
    if (cached !== null) {
      return cached
    }
    
    // Execute function and cache result
    try {
      const result = await fn(...args)
      cache.set(cacheKey, result, ttlSeconds)
      return result
    } catch (error) {
      // Don't cache errors
      throw error
    }
  }
}

/**
 * ISR revalidation configuration for Next.js pages
 */
export interface ISRConfig {
  revalidate: number // Revalidation time in seconds
}

/**
 * Get ISR configuration for different page types
 */
export const ISR_CONFIGS = {
  COMPARISON_PAGE: {
    revalidate: CACHE_CONFIGS.COMPARISON.ttl
  } as ISRConfig,
  
  PROVIDER_PAGE: {
    revalidate: CACHE_CONFIGS.PROVIDERS.ttl
  } as ISRConfig,
  
  PRICING_PAGE: {
    revalidate: CACHE_CONFIGS.PRICING.ttl
  } as ISRConfig,
} as const

/**
 * Client-side cache for frequently accessed data
 */
export class ClientCache {
  private storage: Storage
  private prefix: string

  constructor(storage: Storage = typeof window !== 'undefined' ? window.localStorage : {} as Storage, prefix: string = 'computeprices') {
    this.storage = storage
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.getKey(key))
      if (!item) return null

      const parsed = JSON.parse(item)
      const now = Date.now()
      
      if (parsed.expires && now > parsed.expires) {
        this.delete(key)
        return null
      }
      
      return parsed.data
    } catch (error) {
      console.warn('ClientCache get error:', error)
      return null
    }
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    try {
      const item = {
        data,
        expires: Date.now() + (ttlSeconds * 1000)
      }
      
      this.storage.setItem(this.getKey(key), JSON.stringify(item))
    } catch (error) {
      console.warn('ClientCache set error:', error)
    }
  }

  delete(key: string): void {
    try {
      this.storage.removeItem(this.getKey(key))
    } catch (error) {
      console.warn('ClientCache delete error:', error)
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(this.storage)
      keys.forEach(key => {
        if (key.startsWith(`${this.prefix}:`)) {
          this.storage.removeItem(key)
        }
      })
    } catch (error) {
      console.warn('ClientCache clear error:', error)
    }
  }
}

/**
 * Global client cache instance
 */
export const clientCache = new ClientCache()

/**
 * Performance monitoring utilities
 */
export interface PerformanceMetrics {
  startTime: number
  endTime?: number
  duration?: number
  cacheHit?: boolean
  source: string
}

export class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>()

  start(key: string, source: string): void {
    this.metrics.set(key, {
      startTime: performance.now(),
      source
    })
  }

  end(key: string, cacheHit: boolean = false): PerformanceMetrics | null {
    const metric = this.metrics.get(key)
    if (!metric) return null

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    const completedMetric = {
      ...metric,
      endTime,
      duration,
      cacheHit
    }

    this.metrics.set(key, completedMetric)
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${key}: ${duration.toFixed(2)}ms ${cacheHit ? '(cached)' : '(fresh)'} - ${metric.source}`)
    }

    return completedMetric
  }

  getMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics)
  }

  clear(): void {
    this.metrics.clear()
  }
}

/**
 * Global performance monitor
 */
export const performanceMonitor = new PerformanceMonitor()

/**
 * Cache cleanup utility (run periodically to prevent memory leaks)
 */
export function cleanupCaches(): void {
  providerCache.cleanup()
  pricingCache.cleanup()
  comparisonCache.cleanup()
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[Cache] Cleanup completed:', {
      providerCache: providerCache.getStats(),
      pricingCache: pricingCache.getStats(),
      comparisonCache: comparisonCache.getStats()
    })
  }
}

// Run cache cleanup every 15 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupCaches, 15 * 60 * 1000)
}