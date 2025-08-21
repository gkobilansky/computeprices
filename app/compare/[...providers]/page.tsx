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
import ComparisonHeader from '@/components/comparison/ComparisonHeader'
import ComparisonNavigation from '@/components/comparison/ComparisonNavigation'
import ComparisonLayout, { ComparisonSection, ComparisonFullSection } from '@/components/comparison/ComparisonLayout'
import { 
  FeaturesComparisonSection, 
  ProsConsSection, 
  ComputeServicesSection,
  PricingOptionsSection,
  GettingStartedSection,
  SupportRegionsSection
} from '@/components/comparison/ComparisonSections'
import { fetchProviderComparison } from '@/lib/utils/fetchGPUData'

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

    // Fetch provider comparison data with pricing information
    let comparisonData: any[] | null = null;
    let metadata: any | null = null;
    
    try {
      const comparison = await fetchProviderComparison(
        validation.provider1!.id, 
        validation.provider2!.id
      );
      comparisonData = comparison.comparisonData;
      metadata = comparison.metadata;
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      // Continue with empty comparison data - the pricing table will handle its own data loading
    }

    // Render the enhanced comparison page
    return (
      <div className="min-h-screen">
        {/* Header Section */}
        <ComparisonHeader 
          provider1={validation.provider1}
          provider2={validation.provider2}
          comparisonData={comparisonData || []}
          metadata={metadata || {}}
        />

        {/* Navigation Section */}
        <ComparisonNavigation 
          provider1={validation.provider1}
          provider2={validation.provider2}
        />

        {/* Main Content */}
        <ComparisonLayout 
          provider1={validation.provider1}
          provider2={validation.provider2}
        >
          {/* GPU Pricing Comparison Table - Full Width */}
          <ComparisonFullSection title="GPU Pricing Comparison">
            <ComparisonPricingTableWrapper
              provider1Id={validation.provider1!.id}
              provider2Id={validation.provider2!.id}
              provider1Name={validation.provider1!.name}
              provider2Name={validation.provider2!.name}
            />
          </ComparisonFullSection>

          {/* Features Comparison */}
          <FeaturesComparisonSection 
            provider1={validation.provider1}
            provider2={validation.provider2}
          />

          {/* Pros and Cons */}
          <ProsConsSection 
            provider1={validation.provider1}
            provider2={validation.provider2}
          />

          {/* Compute Services */}
          <ComputeServicesSection 
            provider1={validation.provider1}
            provider2={validation.provider2}
          />

          {/* Pricing Options */}
          <PricingOptionsSection 
            provider1={validation.provider1}
            provider2={validation.provider2}
          />

          {/* Getting Started - Full Width */}
          <GettingStartedSection 
            provider1={validation.provider1}
            provider2={validation.provider2}
          />

          {/* Support & Regions - Full Width */}
          <SupportRegionsSection 
            provider1={validation.provider1}
            provider2={validation.provider2}
          />
        </ComparisonLayout>
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

    // Generate enhanced titles and descriptions
    const title = `${provider1.name} vs ${provider2.name} GPU Pricing Comparison 2024 | ComputePrices.com`
    const description = `Compare ${provider1.name} and ${provider2.name} GPU cloud pricing, features, and performance. Real-time pricing data for AI training, inference, and ML workloads. Find the best deals and save up to 80% on cloud compute costs.`

    // Generate keywords based on providers
    const keywords = [
      `${provider1.name} vs ${provider2.name}`,
      `${provider1.name} GPU pricing`,
      `${provider2.name} GPU pricing`,
      'GPU cloud comparison',
      'AI training costs',
      'ML inference pricing',
      'cloud GPU providers',
      'NVIDIA GPU pricing',
      'H100 pricing comparison',
      'A100 pricing comparison',
      provider1.slug,
      provider2.slug
    ].join(', ')

    // Try to fetch comparison data for richer metadata
    let comparisonMetadata = null
    try {
      const comparison = await fetchProviderComparison(provider1.id, provider2.id)
      comparisonMetadata = comparison.metadata
    } catch (error) {
      console.warn('Could not fetch comparison metadata for SEO:', error)
    }

    const totalGPUs = comparisonMetadata?.totalGPUs || 0
    const bothAvailable = comparisonMetadata?.bothAvailable || 0

    // Enhanced description with stats if available
    const enhancedDescription = totalGPUs > 0 
      ? `${description} Compare pricing for ${totalGPUs} GPU models with ${bothAvailable} direct comparisons available.`
      : description

    return {
      title,
      description: enhancedDescription,
      keywords,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description: enhancedDescription,
        url: canonicalUrl,
        siteName: siteConfig.name,
        type: 'website',
        locale: 'en_US',
        images: [
          {
            url: `${siteConfig.url}/og-image.png`,
            width: 1200,
            height: 630,
            alt: `${provider1.name} vs ${provider2.name} GPU Pricing Comparison`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: enhancedDescription,
        images: [`${siteConfig.url}/og-image.png`],
        site: '@computeprices',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      },
      other: {
        'article:author': 'ComputePrices Team',
        'article:section': 'Technology',
        'article:tag': keywords,
        'og:site_name': siteConfig.name,
      },
    }
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