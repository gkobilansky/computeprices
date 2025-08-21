/**
 * Performance monitoring and optimization utilities
 */

/**
 * Performance metrics interface
 */
export interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

/**
 * Web Vitals metrics
 */
export interface WebVitals {
  CLS: number | null // Cumulative Layout Shift
  FID: number | null // First Input Delay
  FCP: number | null // First Contentful Paint
  LCP: number | null // Largest Contentful Paint
  TTFB: number | null // Time to First Byte
}

/**
 * Performance monitoring class
 */
export class PerformanceTracker {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private observers: Map<string, PerformanceObserver> = new Map()
  private webVitals: Partial<WebVitals> = {}

  /**
   * Start measuring performance for a specific operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    }
    
    this.metrics.set(name, metric)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] Started tracking: ${name}`)
    }
  }

  /**
   * End measuring performance for a specific operation
   */
  end(name: string, additionalMetadata?: Record<string, any>): PerformanceMetric | null {
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`[Performance] No metric found for: ${name}`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime

    const completedMetric: PerformanceMetric = {
      ...metric,
      endTime,
      duration,
      metadata: {
        ...metric.metadata,
        ...additionalMetadata
      }
    }

    this.metrics.set(name, completedMetric)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`, completedMetric.metadata)
    }

    // Report slow operations
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
    }

    return completedMetric
  }

  /**
   * Get all metrics
   */
  getMetrics(): Map<string, PerformanceMetric> {
    return new Map(this.metrics)
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): PerformanceMetric | null {
    return this.metrics.get(name) || null
  }

  /**
   * Initialize Web Vitals monitoring
   */
  initWebVitals(): void {
    if (typeof window === 'undefined') return

    try {
      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let cls = 0
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value
          }
        }
        this.webVitals.CLS = cls
      })
      clsObserver.observe({ type: 'layout-shift', buffered: true })
      this.observers.set('cls', clsObserver)

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.webVitals.FID = (entry as any).processingStart - entry.startTime
          break
        }
      })
      fidObserver.observe({ type: 'first-input', buffered: true })
      this.observers.set('fid', fidObserver)

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.webVitals.LCP = lastEntry.startTime
      })
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      this.observers.set('lcp', lcpObserver)

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.webVitals.FCP = entry.startTime
            break
          }
        }
      })
      fcpObserver.observe({ type: 'paint', buffered: true })
      this.observers.set('fcp', fcpObserver)

    } catch (error) {
      console.warn('[Performance] Web Vitals monitoring failed:', error)
    }
  }

  /**
   * Get current Web Vitals scores
   */
  getWebVitals(): Partial<WebVitals> {
    return { ...this.webVitals }
  }

  /**
   * Report performance summary
   */
  reportSummary(): void {
    const vitals = this.getWebVitals()
    const metrics = Array.from(this.metrics.values())
      .filter(m => m.duration)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))

    console.group('[Performance Summary]')
    
    // Web Vitals
    console.log('Web Vitals:')
    console.log(`  CLS: ${vitals.CLS?.toFixed(3) || 'N/A'} (Good: < 0.1)`)
    console.log(`  FID: ${vitals.FID?.toFixed(2) || 'N/A'}ms (Good: < 100ms)`)
    console.log(`  FCP: ${vitals.FCP?.toFixed(2) || 'N/A'}ms (Good: < 1800ms)`)
    console.log(`  LCP: ${vitals.LCP?.toFixed(2) || 'N/A'}ms (Good: < 2500ms)`)

    // Custom metrics
    if (metrics.length > 0) {
      console.log('\nTop slow operations:')
      metrics.slice(0, 5).forEach(metric => {
        console.log(`  ${metric.name}: ${metric.duration?.toFixed(2)}ms`)
      })
    }

    console.groupEnd()
  }

  /**
   * Clean up observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }
}

/**
 * Global performance tracker instance
 */
export const performanceTracker = new PerformanceTracker()

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window !== 'undefined') {
    performanceTracker.initWebVitals()
    
    // Report summary on page unload
    window.addEventListener('beforeunload', () => {
      performanceTracker.reportSummary()
    })

    // Report summary every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        performanceTracker.reportSummary()
      }, 30000)
    }
  }
}

/**
 * Hook for measuring React component performance
 */
export function usePerformanceTracking(componentName: string) {
  const [renderCount, setRenderCount] = React.useState(0)
  
  React.useEffect(() => {
    setRenderCount(prev => prev + 1)
    performanceTracker.start(`${componentName}-render-${renderCount}`)
    
    return () => {
      performanceTracker.end(`${componentName}-render-${renderCount}`)
    }
  })

  React.useEffect(() => {
    performanceTracker.end(`${componentName}-mount`)
  }, [componentName])

  React.useEffect(() => {
    performanceTracker.start(`${componentName}-mount`)
  }, [componentName])

  return renderCount
}

/**
 * Performance decorator for async functions
 */
export function withPerformanceTracking<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  name: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    performanceTracker.start(name, { args: args.length })
    
    try {
      const result = await fn(...args)
      performanceTracker.end(name, { success: true })
      return result
    } catch (error) {
      performanceTracker.end(name, { success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      throw error
    }
  }
}

/**
 * Bundle size analysis utilities
 */
export interface BundleAnalysis {
  totalSize: number
  gzippedSize: number
  chunks: Array<{
    name: string
    size: number
    modules: number
  }>
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
} | null {
  if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
    return (window.performance as any).memory
  }
  return null
}

/**
 * Resource timing analysis
 */
export function analyzeResourceTiming(): Array<{
  name: string
  duration: number
  transferSize: number
  type: string
}> {
  if (typeof window === 'undefined') return []

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  
  return resources.map(resource => ({
    name: resource.name,
    duration: resource.responseEnd - resource.startTime,
    transferSize: resource.transferSize || 0,
    type: resource.initiatorType || 'unknown'
  })).sort((a, b) => b.duration - a.duration)
}

/**
 * Critical resource preloading
 */
export function preloadCriticalResources(resources: Array<{
  href: string
  as: string
  type?: string
}>): void {
  if (typeof document === 'undefined') return

  resources.forEach(({ href, as, type }) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    if (type) link.type = type
    
    document.head.appendChild(link)
  })
}

/**
 * Intersection Observer for lazy loading performance
 */
export function createLazyLoadObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.1,
    ...options
  })
}

// Add React import if not already imported
import React from 'react'