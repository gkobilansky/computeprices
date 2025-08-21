import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import {
  parseProviderSlugs,
  validateProviderComparison,
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

    // Validate that both providers exist
    const validation = await validateProviderComparison(
      parsed.provider1,
      parsed.provider2
    )

    if (!validation.isValid) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Provider Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              {validation.error}
            </p>
            <div className="space-x-4">
              <a
                href="/providers"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Providers
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

          {/* Placeholder for future GPU pricing comparison table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              GPU Pricing Comparison
            </h2>
            <p className="text-gray-600 text-center">
              Detailed GPU pricing comparison table will be implemented in a future update.
            </p>
          </div>
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