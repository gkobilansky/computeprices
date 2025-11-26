'use client'

import React, { lazy, Suspense } from 'react'
import { Provider } from '@/types/comparison'

/**
 * Loading fallback component for lazy-loaded sections
 */
const SectionLoadingFallback = ({ title }: { title: string }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  </div>
)

/**
 * Error boundary fallback for lazy-loaded sections
 */
const SectionErrorFallback = ({ title, error }: { title: string; error?: Error }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-8">
    <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
    <p className="text-red-600">
      Failed to load this comparison section. Please try refreshing the page.
    </p>
    {process.env.NODE_ENV === 'development' && error && (
      <pre className="mt-4 text-xs text-red-500 bg-red-100 p-2 rounded overflow-auto">
        {error.message}
      </pre>
    )}
  </div>
)

// Lazy load comparison sections to improve initial page load performance
const FeaturesComparisonSection = lazy(() => 
  import('./ComparisonSections').then(module => ({ 
    default: module.FeaturesComparisonSection 
  }))
)

const ProsConsSection = lazy(() => 
  import('./ComparisonSections').then(module => ({ 
    default: module.ProsConsSection 
  }))
)

const ComputeServicesSection = lazy(() => 
  import('./ComparisonSections').then(module => ({ 
    default: module.ComputeServicesSection 
  }))
)

const PricingOptionsSection = lazy(() => 
  import('./ComparisonSections').then(module => ({ 
    default: module.PricingOptionsSection 
  }))
)

const GettingStartedSection = lazy(() => 
  import('./ComparisonSections').then(module => ({ 
    default: module.GettingStartedSection 
  }))
)

const SupportRegionsSection = lazy(() => 
  import('./ComparisonSections').then(module => ({ 
    default: module.SupportRegionsSection 
  }))
)

// Define props interface
interface ComparisonSectionProps {
  provider1: Provider
  provider2: Provider
}

/**
 * Wrapper component with error boundary and loading state
 */
const LazySection = ({ 
  Component, 
  title, 
  provider1, 
  provider2 
}: { 
  Component: React.ComponentType<ComparisonSectionProps>
  title: string 
  provider1: Provider
  provider2: Provider
}) => (
  <Suspense fallback={<SectionLoadingFallback title={title} />}>
    <ErrorBoundary fallback={(error) => <SectionErrorFallback title={title} error={error} />}>
      <Component provider1={provider1} provider2={provider2} />
    </ErrorBoundary>
  </Suspense>
)

/**
 * Simple error boundary component
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: (error: Error) => React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback: (error: Error) => React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[LazyComparisonSections] Error loading section:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error)
    }

    return this.props.children
  }
}

// Export lazy-loaded components
export const LazyFeaturesComparisonSection = ({ provider1, provider2 }: ComparisonSectionProps) => (
  <LazySection
    Component={FeaturesComparisonSection}
    title="Features Comparison"
    provider1={provider1}
    provider2={provider2}
  />
)

export const LazyProsConsSection = ({ provider1, provider2 }: ComparisonSectionProps) => (
  <LazySection
    Component={ProsConsSection}
    title="Pros & Cons"
    provider1={provider1}
    provider2={provider2}
  />
)

export const LazyComputeServicesSection = ({ provider1, provider2 }: ComparisonSectionProps) => (
  <LazySection
    Component={ComputeServicesSection}
    title="Compute Services"
    provider1={provider1}
    provider2={provider2}
  />
)

export const LazyPricingOptionsSection = ({ provider1, provider2 }: ComparisonSectionProps) => (
  <LazySection
    Component={PricingOptionsSection}
    title="Pricing Options"
    provider1={provider1}
    provider2={provider2}
  />
)

export const LazyGettingStartedSection = ({ provider1, provider2 }: ComparisonSectionProps) => (
  <LazySection
    Component={GettingStartedSection}
    title="Getting Started"
    provider1={provider1}
    provider2={provider2}
  />
)

export const LazySupportRegionsSection = ({ provider1, provider2 }: ComparisonSectionProps) => (
  <LazySection
    Component={SupportRegionsSection}
    title="Support & Regions"
    provider1={provider1}
    provider2={provider2}
  />
)
