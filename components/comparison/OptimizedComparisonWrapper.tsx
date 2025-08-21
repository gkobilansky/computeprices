'use client'

import React, { memo, lazy, Suspense } from 'react'
import { performanceTracker } from '@/lib/performance'
import { getPricingCacheKey, pricingCache, CACHE_CONFIGS } from '@/lib/cache'

// Lazy load the pricing table for better performance
const ComparisonPricingTable = lazy(() => import('./ComparisonPricingTable'))

/**
 * Loading fallback for pricing table
 */
const PricingTableSkeleton = memo(() => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
      
      {/* Table headers */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
      
      {/* Table rows */}
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 mb-3">
          <div className="h-8 bg-gray-100 rounded"></div>
          <div className="h-8 bg-gray-100 rounded"></div>
          <div className="h-8 bg-gray-100 rounded"></div>
          <div className="h-8 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  </div>
))
PricingTableSkeleton.displayName = 'PricingTableSkeleton'

/**
 * Error fallback for pricing table
 */
const PricingTableError = memo(({ onRetry }: { onRetry?: () => void }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
    <div className="text-red-600 mb-4">
      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-lg font-semibold">Failed to load pricing comparison</h3>
    </div>
    <p className="text-red-600 mb-4">
      We're having trouble loading the pricing data. Please try again.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
))
PricingTableError.displayName = 'PricingTableError'

/**
 * Props interface
 */
interface OptimizedComparisonWrapperProps {
  provider1Id: string
  provider2Id: string
  provider1Name: string
  provider2Name: string
}

/**
 * Error boundary for the pricing table
 */
class PricingTableErrorBoundary extends React.Component<
  { 
    children: React.ReactNode
    onError?: (error: Error) => void
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PricingTable] Error boundary caught error:', error, errorInfo)
    performanceTracker.end('pricing-table-load', { 
      success: false, 
      error: error.message 
    })
    
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  render() {
    if (this.state.hasError) {
      return <PricingTableError onRetry={() => this.setState({ hasError: false, error: null })} />
    }

    return this.props.children
  }
}

/**
 * Optimized comparison wrapper with performance monitoring and caching
 */
const OptimizedComparisonWrapper = memo(({
  provider1Id,
  provider2Id,
  provider1Name,
  provider2Name
}: OptimizedComparisonWrapperProps) => {
  const [retryCount, setRetryCount] = React.useState(0)
  const cacheKey = getPricingCacheKey(provider1Id, provider2Id)

  // Start performance tracking
  React.useEffect(() => {
    performanceTracker.start('pricing-table-load', {
      provider1Id,
      provider2Id,
      cacheKey,
      retryCount
    })
  }, [provider1Id, provider2Id, cacheKey, retryCount])

  // Handle successful load tracking (removed callback since component doesn't support it)
  React.useEffect(() => {
    performanceTracker.end('pricing-table-load', { 
      success: true,
      cached: pricingCache.has(cacheKey)
    })
  }, [cacheKey])

  // Handle retry
  const handleRetry = React.useCallback(() => {
    setRetryCount(prev => prev + 1)
    // Clear cache to force fresh data
    pricingCache.delete(cacheKey)
  }, [cacheKey])

  return (
    <div className="w-full">
      <PricingTableErrorBoundary onError={(error) => console.error('[PricingTable] Error:', error)}>
        <Suspense fallback={<PricingTableSkeleton />}>
          <ComparisonPricingTable
            provider1Id={provider1Id}
            provider2Id={provider2Id}
            provider1Name={provider1Name}
            provider2Name={provider2Name}
            key={retryCount} // Force re-render on retry
          />
        </Suspense>
      </PricingTableErrorBoundary>
    </div>
  )
})

OptimizedComparisonWrapper.displayName = 'OptimizedComparisonWrapper'

export default OptimizedComparisonWrapper

/**
 * HOC for adding performance monitoring to any comparison component
 */
export function withComparisonPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const PerformanceMonitoredComponent = (props: P) => {
    React.useEffect(() => {
      performanceTracker.start(`${componentName}-render`)
      
      return () => {
        performanceTracker.end(`${componentName}-render`)
      }
    })

    return <WrappedComponent {...props} />
  }

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`
  
  return memo(PerformanceMonitoredComponent)
}

/**
 * Hook for progressive enhancement of comparison features
 */
export function useProgressiveEnhancement() {
  const [isEnhanced, setIsEnhanced] = React.useState(false)
  const [capabilities, setCapabilities] = React.useState({
    intersectionObserver: false,
    webgl: false,
    webWorkers: false,
    serviceWorker: false
  })

  React.useEffect(() => {
    // Check browser capabilities
    const newCapabilities = {
      intersectionObserver: typeof IntersectionObserver !== 'undefined',
      webgl: (() => {
        try {
          const canvas = document.createElement('canvas')
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        } catch {
          return false
        }
      })(),
      webWorkers: typeof Worker !== 'undefined',
      serviceWorker: 'serviceWorker' in navigator
    }

    setCapabilities(newCapabilities)
    
    // Enable enhancements if key capabilities are available
    if (newCapabilities.intersectionObserver) {
      setIsEnhanced(true)
    }
  }, [])

  return { isEnhanced, capabilities }
}

/**
 * Preload critical comparison data
 */
export function preloadComparisonData(provider1Id: string, provider2Id: string): void {
  if (typeof window === 'undefined') return

  // Preload pricing data API endpoint
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = `/api/pricing/compare?provider1=${provider1Id}&provider2=${provider2Id}`
  document.head.appendChild(link)

  // Preload comparison components
  import('./ComparisonPricingTable').catch(() => {
    // Silently handle preload failures
  })
}