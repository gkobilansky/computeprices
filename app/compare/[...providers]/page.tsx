import { Metadata } from 'next'
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
import ComparisonPricingTableWrapper from '@/components/comparison/ComparisonPricingTableWrapper'

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
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </a>
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
                        Similar to "{parsed.provider1}":
                      </h3>
                      <div className="space-y-2">
                        {validation.provider1Suggestions.slice(0, 3).map((suggestion, idx) => (
                          <a
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
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Provider 2 Suggestions */}
                  {validation.provider2Suggestions && validation.provider2Suggestions.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700 mb-3">
                        Similar to "{parsed.provider2}":
                      </h3>
                      <div className="space-y-2">
                        {validation.provider2Suggestions.slice(0, 3).map((suggestion, idx) => (
                          <a
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
                          </a>
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
                <a
                  href="/compare/aws-vs-coreweave"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  AWS vs CoreWeave
                </a>
                <a
                  href="/compare/aws-vs-runpod"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  AWS vs RunPod
                </a>
                <a
                  href="/compare/coreweave-vs-lambda"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  CoreWeave vs Lambda
                </a>
                <a
                  href="/compare/google-vs-azure"
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Google vs Azure
                </a>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/providers"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse All Providers
              </a>
              <a
                href="/"
                className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </a>
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

    // Render the comparison page
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {validation.provider1!.name} vs {validation.provider2!.name}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Compare GPU pricing, features, and specifications between {validation.provider1!.name} and {validation.provider2!.name} cloud providers.
            </p>
          </div>

          {/* Comparison Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Provider 1 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {validation.provider1!.name}
                </h2>
                {validation.provider1!.description && (
                  <p className="text-gray-600">
                    {validation.provider1!.description}
                  </p>
                )}
              </div>

              {/* Provider 1 Details */}
              {validation.provider1!.features && validation.provider1!.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                  <ul className="space-y-2">
                    {validation.provider1!.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">{feature.title}</strong>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.provider1!.link && (
                <div className="text-center">
                  <a
                    href={validation.provider1!.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Visit {validation.provider1!.name}
                  </a>
                </div>
              )}
            </div>

            {/* Provider 2 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {validation.provider2!.name}
                </h2>
                {validation.provider2!.description && (
                  <p className="text-gray-600">
                    {validation.provider2!.description}
                  </p>
                )}
              </div>

              {/* Provider 2 Details */}
              {validation.provider2!.features && validation.provider2!.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                  <ul className="space-y-2">
                    {validation.provider2!.features.slice(0, 5).map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <div>
                          <strong className="text-gray-900">{feature.title}</strong>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.provider2!.link && (
                <div className="text-center">
                  <a
                    href={validation.provider2!.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Visit {validation.provider2!.name}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* GPU Pricing Comparison Table */}
          <ComparisonPricingTableWrapper
            provider1Id={validation.provider1!.id}
            provider2Id={validation.provider2!.id}
            provider1Name={validation.provider1!.name}
            provider2Name={validation.provider2!.name}
          />
        </div>
      </div>
    )

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
            <a
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </a>
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
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    )
  }
}

// Generate metadata for the comparison page
export async function generateMetadata({
  params,
}: ComparePageProps): Promise<Metadata> {
  try {
    const { providers } = await params
    const parsed = parseProviderSlugs(providers)
    
    if (!parsed.isValid) {
      return {
        title: 'Invalid Provider Comparison | ComputePrices.com',
        description: 'Invalid provider comparison URL format.',
      }
    }

    const validation = await validateProviderComparison(
      parsed.provider1,
      parsed.provider2
    )

    if (!validation.isValid) {
      return {
        title: 'Provider Not Found | ComputePrices.com',
        description: 'The requested provider comparison could not be found.',
      }
    }

    const provider1 = validation.provider1!
    const provider2 = validation.provider2!
    const canonicalUrl = generateCanonicalComparisonURL(
      provider1.slug,
      provider2.slug,
      siteConfig.url
    )

    const title = `${provider1.name} vs ${provider2.name} GPU Pricing Comparison | ComputePrices.com`
    const description = `Compare ${provider1.name} and ${provider2.name} GPU cloud pricing, features, and specifications. Find the best deals for AI training, inference, and ML workloads. Save up to 80% on cloud compute costs.`

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: siteConfig.name,
        images: [
          {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: `${provider1.name} vs ${provider2.name} GPU Comparison`,
          },
        ],
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: ['/og-image.png'],
      },
    }
  } catch (error) {
    console.error('Error generating metadata for comparison page:', error)
    return {
      title: 'Provider Comparison | ComputePrices.com',
      description: 'Compare cloud GPU providers and find the best deals.',
    }
  }
}