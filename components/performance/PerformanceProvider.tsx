'use client'

import React, { useEffect } from 'react'
import { initPerformanceMonitoring, performanceTracker } from '@/lib/performance'
import { preloadComparisonData } from '@/components/comparison/OptimizedComparisonWrapper'

/**
 * Props for the PerformanceProvider
 */
interface PerformanceProviderProps {
  children: React.ReactNode
  provider1Id?: string
  provider2Id?: string
  enableWebVitals?: boolean
  enablePreloading?: boolean
}

/**
 * Performance provider component that initializes monitoring and optimization features
 */
export default function PerformanceProvider({
  children,
  provider1Id,
  provider2Id,
  enableWebVitals = true,
  enablePreloading = true
}: PerformanceProviderProps) {
  useEffect(() => {
    // Initialize performance monitoring
    if (enableWebVitals) {
      initPerformanceMonitoring()
    }

    // Start page load tracking
    performanceTracker.start('comparison-page-load', {
      provider1Id,
      provider2Id,
      timestamp: Date.now()
    })

    // Preload critical resources if IDs are provided
    if (enablePreloading && provider1Id && provider2Id) {
      // Small delay to not interfere with initial render
      setTimeout(() => {
        preloadComparisonData(provider1Id, provider2Id)
      }, 100)
    }

    // Report page load completion
    const handleLoad = () => {
      performanceTracker.end('comparison-page-load', {
        readyState: document.readyState,
        visibilityState: document.visibilityState
      })
    }

    // Track when page becomes interactive
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleLoad)
    } else {
      handleLoad()
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', handleLoad)
    }
  }, [provider1Id, provider2Id, enableWebVitals, enablePreloading])

  // Track visibility changes (user switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        performanceTracker.start('page-hidden')
      } else {
        performanceTracker.end('page-hidden')
        // Re-initialize monitoring when user comes back
        if (enableWebVitals) {
          performanceTracker.initWebVitals()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enableWebVitals])

  return <>{children}</>
}

/**
 * Hook for component-level performance tracking
 */
export function useComponentPerformance(componentName: string) {
  const mountTime = React.useRef(performance.now())
  const renderCount = React.useRef(0)

  // Track render performance
  React.useEffect(() => {
    renderCount.current += 1
    const renderStart = performance.now()
    
    return () => {
      const renderEnd = performance.now()
      const renderDuration = renderEnd - renderStart
      
      performanceTracker.start(`${componentName}-render-${renderCount.current}`)
      performanceTracker.end(`${componentName}-render-${renderCount.current}`, {
        duration: renderDuration,
        renderCount: renderCount.current
      })
    }
  })

  // Track mount/unmount
  React.useEffect(() => {
    const mountDuration = performance.now() - mountTime.current
    performanceTracker.start(`${componentName}-mount`)
    performanceTracker.end(`${componentName}-mount`, { duration: mountDuration })

    return () => {
      performanceTracker.start(`${componentName}-unmount`)
      performanceTracker.end(`${componentName}-unmount`)
    }
  }, [componentName])

  return {
    renderCount: renderCount.current,
    mountTime: mountTime.current
  }
}

/**
 * Performance metrics display component (development only)
 */
export function PerformanceDebugger() {
  const [isVisible, setIsVisible] = React.useState(false)
  const [metrics, setMetrics] = React.useState<any>(null)

  React.useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    const updateMetrics = () => {
      setMetrics({
        webVitals: performanceTracker.getWebVitals(),
        customMetrics: Array.from(performanceTracker.getMetrics().values())
          .filter(m => m.duration)
          .sort((a, b) => (b.duration || 0) - (a.duration || 0))
          .slice(0, 10)
      })
    }

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000)
    updateMetrics() // Initial load

    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 z-50"
        title="Show Performance Metrics"
      >
        📊
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-auto z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Performance Metrics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      {metrics && (
        <div className="space-y-3">
          {/* Web Vitals */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-1">Web Vitals</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>CLS:</span>
                <span className={metrics.webVitals.CLS > 0.1 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.webVitals.CLS?.toFixed(3) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>LCP:</span>
                <span className={metrics.webVitals.LCP > 2500 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.webVitals.LCP?.toFixed(0) || 'N/A'}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>FID:</span>
                <span className={metrics.webVitals.FID > 100 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.webVitals.FID?.toFixed(0) || 'N/A'}ms
                </span>
              </div>
            </div>
          </div>

          {/* Custom Metrics */}
          {metrics.customMetrics.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Slow Operations</h4>
              <div className="text-xs space-y-1">
                {metrics.customMetrics.slice(0, 5).map((metric: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate">{metric.name.replace(/-/g, ' ')}</span>
                    <span className={metric.duration > 1000 ? 'text-red-600' : 'text-gray-600'}>
                      {metric.duration?.toFixed(0)}ms
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}