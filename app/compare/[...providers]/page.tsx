import { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  parseProviderSlugs,
  validateProviderComparison,
  validateProviderComparisonWithSuggestions,
  getCanonicalRedirectURL,
  generateCanonicalComparisonURL
} from '@/lib/providers'
import {
  Provider,
  ProviderComparison,
  ComparisonMetadata,
  ParsedProviderSlugs,
  ComparisonValidationResult,
  ComparisonError
} from '@/types/comparison'
import { siteConfig } from '@/app/metadata'
import ComparisonPricingTable from '@/components/comparison/ComparisonPricingTable'
import ComparisonHeader from '@/components/comparison/ComparisonHeader'
import ComparisonNavigation from '@/components/comparison/ComparisonNavigation'
import ComparisonLayout, { ComparisonSection, ComparisonFullSection } from '@/components/comparison/ComparisonLayout'
import { 
  LazyFeaturesComparisonSection, 
  LazyProsConsSection, 
  LazyComputeServicesSection,
  LazyPricingOptionsSection,
  LazyGettingStartedSection,
  LazySupportRegionsSection
} from '@/components/comparison/LazyComparisonSections'
import RelatedComparisons from '@/components/comparison/RelatedComparisons'
import ComparisonStructuredData from '@/components/seo/ComparisonStructuredData'
import { fetchProviderComparison } from '@/lib/utils/fetchGPUData'
import { generateComparisonMetadata, extractComparisonStats } from '@/lib/seo/comparison-metadata'
import { 
  generateStaticParamsWithLimit, 
  PRODUCTION_STATIC_CONFIG,
  DEVELOPMENT_STATIC_CONFIG
} from '@/lib/static-generation'

interface ComparePageProps {
  params: Promise<{
    providers: string[]
  }>
}

// Main comparison page component
export default async function ComparePage({ params }: ComparePageProps) {
  try {
    const { providers } = await params
    // Parse provider slugs from URL
    const parsed = parseProviderSlugs(providers)
    
    if (!parsed.isValid) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Invalid Provider Comparison
            </h1>
            <p className="text-gray-600 mb-6">
              {parsed.error || 'Unable to parse provider comparison URL'}
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Supported formats:
            </p>
            <ul className="text-sm text-gray-500 list-disc list-inside space-y-1">
              <li>aws-vs-coreweave</li>
              <li>aws/vs/coreweave</li>
              <li>aws,coreweave</li>
              <li>aws/coreweave</li>
            </ul>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      )
    }

    // Validate that both providers exist with suggestions
    const validation = await validateProviderComparisonWithSuggestions(
      parsed.provider1,
      parsed.provider2
    )

    if (!validation.isValid) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-4xl mx-auto px-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Provider Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              {validation.error}
            </p>
            
            {/* Show suggestions if available */}
            {(validation.provider1Suggestions && validation.provider1Suggestions.length > 0) || 
             (validation.provider2Suggestions && validation.provider2Suggestions.length > 0) ? (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Did you mean?
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Provider 1 Suggestions */}
                  {validation.provider1Suggestions && validation.provider1Suggestions.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Similar to &ldquo;{parsed.provider1}&rdquo;:
                      </h3>
                      <div className="space-y-2">
                        {validation.provider1Suggestions.slice(0, 3).map((suggestion, idx) => (
                          <Link
                            key={idx}
                            href={`/compare/${suggestion.slug}-vs-${parsed.provider2}`}
                            className="block px-3 py-2 text-left rounded hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="font-medium text-blue-600">
                              {suggestion.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {Math.round(suggestion.similarity * 100)}% match
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Provider 2 Suggestions */}
                  {validation.provider2Suggestions && validation.provider2Suggestions.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Similar to &ldquo;{parsed.provider2}&rdquo;:
                      </h3>
                      <div className="space-y-2">
                        {validation.provider2Suggestions.slice(0, 3).map((suggestion, idx) => (
                          <Link
                            key={idx}
                            href={`/compare/${parsed.provider1}-vs-${suggestion.slug}`}
                            className="block px-3 py-2 text-left rounded hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="font-medium text-blue-600">
                              {suggestion.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {Math.round(suggestion.similarity * 100)}% match
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
            
            {/* Popular Comparisons */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Popular Comparisons
              </h2>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href="/compare/aws-vs-coreweave"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  AWS vs CoreWeave
                </Link>
                <Link
                  href="/compare/aws-vs-runpod"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  AWS vs RunPod
                </Link>
                <Link
                  href="/compare/coreweave-vs-lambda"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  CoreWeave vs Lambda
                </Link>
                <Link
                  href="/compare/google-vs-azure"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Google vs Azure
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/providers"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse All Providers
              </Link>
              <Link
                href="/"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )
    }

    // Check if we need to redirect to canonical URL
    const currentPath = `/compare/${providers.join('/')}`
    const canonicalRedirect = getCanonicalRedirectURL(
      parsed.provider1,
      parsed.provider2,
      currentPath
    )
    
    if (canonicalRedirect) {
      redirect(canonicalRedirect)
    }

    // Fetch provider comparison data with pricing information
    let comparisonPayload: Awaited<ReturnType<typeof fetchProviderComparison>> | null = null;
    
    try {
      comparisonPayload = await fetchProviderComparison(
        validation.provider1!.id,
        validation.provider2!.id
      );
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      // Continue with empty comparison data - the pricing table will handle its own data loading
    }


    const pageContent = (
      <div className="min-h-screen">
        {/* Header Section */}
        <ComparisonHeader 
          provider1={validation.provider1!}
          provider2={validation.provider2!}
          comparisonData={comparisonPayload?.comparisonData || []}
          metadata={comparisonPayload?.metadata || {}}
        />

        {/* Navigation Section */}
        <ComparisonNavigation 
          provider1={validation.provider1!}
          provider2={validation.provider2!}
        />

        {/* Main Content */}
        <ComparisonLayout 
          provider1={validation.provider1!}
          provider2={validation.provider2!}
        >
          {/* GPU Pricing Comparison Table - Full Width - Optimized */}
          <ComparisonFullSection title="GPU Pricing Comparison">
            <ComparisonPricingTable
              provider1Id={validation.provider1!.id}
              provider2Id={validation.provider2!.id}
              provider1Name={validation.provider1!.name}
              provider2Name={validation.provider2!.name}
              initialData={comparisonPayload || undefined}
            />
          </ComparisonFullSection>

          {/* Features Comparison - Lazy Loaded */}
          <LazyFeaturesComparisonSection 
            provider1={validation.provider1!}
            provider2={validation.provider2!}
          />

          {/* Pros and Cons - Lazy Loaded */}
          <LazyProsConsSection 
            provider1={validation.provider1!}
            provider2={validation.provider2!}
          />

          {/* Compute Services - Lazy Loaded */}
          <LazyComputeServicesSection 
            provider1={validation.provider1!}
            provider2={validation.provider2!}
          />

          {/* Pricing Options - Lazy Loaded */}
          <LazyPricingOptionsSection 
            provider1={validation.provider1!}
            provider2={validation.provider2!}
          />

          {/* Getting Started - Full Width - Lazy Loaded */}
          <LazyGettingStartedSection 
            provider1={validation.provider1!}
            provider2={validation.provider2!}
          />

          {/* Support & Regions - Full Width - Lazy Loaded */}
          <LazySupportRegionsSection 
            provider1={validation.provider1!}
            provider2={validation.provider2!}
          />

          {/* Related Comparisons - Full Width */}
          <ComparisonFullSection title="">
            <RelatedComparisons 
              currentProvider1={validation.provider1!}
              currentProvider2={validation.provider2!}
            />
          </ComparisonFullSection>
        </ComparisonLayout>

        {/* SEO Structured Data */}
        <ComparisonStructuredData
          provider1={validation.provider1!}
          provider2={validation.provider2!}
          comparisonData={comparisonPayload?.comparisonData || []}
        />
      </div>
    )

    return pageContent

  } catch (error) {
    console.error('Error in ComparePage:', error)
    
    if (error instanceof ComparisonError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Comparison Error
            </h1>
            <p className="text-gray-600 mb-8">
              {error.message}
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      )
    }

    // Generic error fallback
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-8">
            An unexpected error occurred while loading the comparison.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }
}

// Generate enhanced metadata for the comparison page
export async function generateMetadata({
  params,
}: ComparePageProps): Promise<Metadata> {
  try {
    const { providers } = await params
    const parsed = parseProviderSlugs(providers)
    
    if (!parsed.isValid) {
      return {
        title: 'Invalid Provider Comparison | ComputePrices.com',
        description: 'Invalid provider comparison URL format. Use formats like aws-vs-coreweave or provider1/vs/provider2.',
        robots: {
          index: false,
          follow: true,
        },
      }
    }

    const validation = await validateProviderComparison(
      parsed.provider1,
      parsed.provider2
    )

    if (!validation.isValid) {
      return {
        title: 'Provider Not Found | ComputePrices.com',
        description: 'The requested provider comparison could not be found. Browse our available GPU cloud providers instead.',
        robots: {
          index: false,
          follow: true,
        },
      }
    }

    const provider1 = validation.provider1!
    const provider2 = validation.provider2!
    const canonicalUrl = generateCanonicalComparisonURL(
      provider1.slug,
      provider2.slug,
      siteConfig.url
    )

    const currentPath = `/compare/${providers.join('/')}`

    // Try to fetch comparison data for richer metadata
    let comparisonStats = null
    try {
      const comparison = await fetchProviderComparison(provider1.id, provider2.id)
      comparisonStats = extractComparisonStats(comparison.comparisonData)
    } catch (error) {
      console.warn('Could not fetch comparison data for SEO metadata:', error)
    }

    // Use the new SEO metadata generation utility
    return generateComparisonMetadata({
      provider1,
      provider2,
      comparisonStats: comparisonStats || undefined,
      currentPath
    })
  } catch (error) {
    console.error('Error generating metadata for comparison page:', error)
    return {
      title: 'Provider Comparison | ComputePrices.com',
      description: 'Compare cloud GPU providers and find the best deals for AI training and inference workloads.',
      robots: {
        index: false,
        follow: true,
      },
    }
  }
}

/**
 * Generate static params for all valid provider combinations
 * This enables static generation at build time for better performance and SEO
 */
export async function generateStaticParams(): Promise<Array<{ providers: string[] }>> {
  try {
    console.log('[Static Generation] Starting generateStaticParams for comparison pages...')
    
    const isProduction = process.env.NODE_ENV === 'production'
    const config = isProduction ? PRODUCTION_STATIC_CONFIG : DEVELOPMENT_STATIC_CONFIG
    
    // In production, limit combinations to manage build time
    const maxCombinations = isProduction ? 150 : 20
    
    const combinations = await generateStaticParamsWithLimit(maxCombinations, config)
    
    console.log(`[Static Generation] Generated ${combinations.length} static params for comparison pages`)
    
    // Log some examples for debugging
    if (combinations.length > 0) {
      const examples = combinations.slice(0, 3).map(c => c.providers[0])
      console.log(`[Static Generation] Examples: ${examples.join(', ')}`)
    }
    
    return combinations
  } catch (error) {
    console.error('[Static Generation] Error in generateStaticParams:', error)
    
    // Return empty array to prevent build failure
    // Pages will be generated on-demand instead
    return []
  }
}

/**
 * ISR (Incremental Static Regeneration) configuration
 * Automatically revalidate pages when pricing data changes (6 hours)
 */
export const revalidate = 21600 // 6 hours in seconds
