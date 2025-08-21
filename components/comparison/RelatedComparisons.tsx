import { Provider } from '@/types/comparison'
import { getAllProviderSlugs, normalizeProviderSlug } from '@/lib/providers'
import providersData from '@/data/providers.json'

interface RelatedComparisonsProps {
  currentProvider1: Provider
  currentProvider2: Provider
  maxSuggestions?: number
}

interface ComparisonSuggestion {
  provider1Name: string
  provider2Name: string
  provider1Slug: string
  provider2Slug: string
  url: string
  priority: 'high' | 'medium' | 'low'
  reason: string
}

/**
 * Component that suggests related provider comparisons for better internal linking
 */
export default async function RelatedComparisons({
  currentProvider1,
  currentProvider2,
  maxSuggestions = 6
}: RelatedComparisonsProps) {
  const suggestions = await generateRelatedComparisons(
    currentProvider1,
    currentProvider2,
    maxSuggestions
  )

  if (suggestions.length === 0) {
    return null
  }

  return (
    <section className="bg-gray-50 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Related Comparisons
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Explore how these providers compare to other popular GPU cloud services
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((suggestion, index) => (
          <ComparisonCard
            key={`${suggestion.provider1Slug}-${suggestion.provider2Slug}`}
            suggestion={suggestion}
          />
        ))}
      </div>

      {/* Popular Comparisons Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Popular Comparisons
        </h3>
        <div className="flex flex-wrap gap-2">
          {getPopularComparisons().slice(0, 8).map((comparison) => (
            <a
              key={comparison.url}
              href={comparison.url}
              className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {comparison.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Individual comparison card component
 */
function ComparisonCard({ suggestion }: { suggestion: ComparisonSuggestion }) {
  return (
    <a
      href={suggestion.url}
      className="block p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900 text-sm">
          {suggestion.provider1Name} vs {suggestion.provider2Name}
        </h3>
        <PriorityBadge priority={suggestion.priority} />
      </div>
      <p className="text-xs text-gray-600">
        {suggestion.reason}
      </p>
    </a>
  )
}

/**
 * Priority badge component
 */
function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const styles = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700'
  }

  const labels = {
    high: 'Popular',
    medium: 'Similar',
    low: 'Related'
  }

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[priority]}`}>
      {labels[priority]}
    </span>
  )
}

/**
 * Generate related comparison suggestions
 */
async function generateRelatedComparisons(
  currentProvider1: Provider,
  currentProvider2: Provider,
  maxSuggestions: number
): Promise<ComparisonSuggestion[]> {
  const suggestions: ComparisonSuggestion[] = []
  const currentSlugs = [currentProvider1.slug, currentProvider2.slug]

  try {
    // Get all available providers
    const allProviderSlugs = await getAllProviderSlugs()
    const availableProviders = providersData.filter(p => 
      allProviderSlugs.includes(p.slug) && 
      !currentSlugs.includes(p.slug)
    )

    // Priority providers for high-quality suggestions
    const priorityProviders = ['aws', 'google', 'azure', 'coreweave', 'runpod', 'lambda', 'vast']
    
    // 1. Suggest comparisons with each current provider vs priority providers
    for (const currentProvider of [currentProvider1, currentProvider2]) {
      for (const prioritySlug of priorityProviders) {
        if (suggestions.length >= maxSuggestions) break
        
        const provider = availableProviders.find(p => p.slug === prioritySlug)
        if (provider && !currentSlugs.includes(provider.slug)) {
          suggestions.push({
            provider1Name: currentProvider.name,
            provider2Name: provider.name,
            provider1Slug: currentProvider.slug,
            provider2Slug: provider.slug,
            url: `/compare/${currentProvider.slug}-vs-${provider.slug}`,
            priority: 'high',
            reason: `Compare ${currentProvider.name} with another leading provider`
          })
        }
      }
    }

    // 2. Add similar providers (based on features/category)
    const similarProviders = findSimilarProviders(currentProvider1, currentProvider2, availableProviders)
    for (const similar of similarProviders.slice(0, 2)) {
      if (suggestions.length >= maxSuggestions) break
      
      suggestions.push({
        provider1Name: currentProvider1.name,
        provider2Name: similar.name,
        provider1Slug: currentProvider1.slug,
        provider2Slug: similar.slug,
        url: `/compare/${currentProvider1.slug}-vs-${similar.slug}`,
        priority: 'medium',
        reason: `Similar features to ${currentProvider1.name}`
      })
    }

    // 3. Add three-way comparisons (popular combinations)
    const popularTriads = [
      ['aws', 'coreweave', 'runpod'],
      ['google', 'azure', 'aws'],
      ['lambda', 'vast', 'runpod']
    ]

    for (const triad of popularTriads) {
      if (suggestions.length >= maxSuggestions) break
      
      // Find which providers from the triad are not currently being compared
      const availableFromTriad = triad.filter(slug => 
        !currentSlugs.includes(slug) &&
        availableProviders.some(p => p.slug === slug)
      )

      if (availableFromTriad.length >= 2) {
        const provider1 = availableProviders.find(p => p.slug === availableFromTriad[0])
        const provider2 = availableProviders.find(p => p.slug === availableFromTriad[1])
        
        if (provider1 && provider2) {
          suggestions.push({
            provider1Name: provider1.name,
            provider2Name: provider2.name,
            provider1Slug: provider1.slug,
            provider2Slug: provider2.slug,
            url: `/compare/${provider1.slug}-vs-${provider2.slug}`,
            priority: 'medium',
            reason: 'Popular comparison combination'
          })
        }
      }
    }

    // 4. Fill remaining slots with other providers
    const remainingProviders = availableProviders.filter(p => 
      !priorityProviders.includes(p.slug) &&
      !suggestions.some(s => s.provider1Slug === p.slug || s.provider2Slug === p.slug)
    )

    for (const provider of remainingProviders.slice(0, maxSuggestions - suggestions.length)) {
      suggestions.push({
        provider1Name: currentProvider1.name,
        provider2Name: provider.name,
        provider1Slug: currentProvider1.slug,
        provider2Slug: provider.slug,
        url: `/compare/${currentProvider1.slug}-vs-${provider.slug}`,
        priority: 'low',
        reason: `Alternative to ${currentProvider1.name}`
      })
    }

    // Remove duplicates and limit results
    const uniqueSuggestions = suggestions
      .filter((suggestion, index, self) => 
        index === self.findIndex(s => s.url === suggestion.url)
      )
      .slice(0, maxSuggestions)

    return uniqueSuggestions
  } catch (error) {
    console.error('Error generating related comparisons:', error)
    return []
  }
}

/**
 * Find providers similar to the current ones based on features
 */
function findSimilarProviders(
  provider1: Provider,
  provider2: Provider,
  availableProviders: any[]
): any[] {
  const currentFeatures = new Set([
    ...provider1.features?.map((f: any) => f.title) || [],
    ...provider2.features?.map((f: any) => f.title) || []
  ])

  const similarityScores = availableProviders.map(provider => {
    const providerFeatures = new Set(provider.features?.map((f: any) => f.title) || [])
    const currentFeaturesArray = Array.from(currentFeatures)
    const commonFeatures = new Set(currentFeaturesArray.filter(f => providerFeatures.has(f)))
    const similarity = commonFeatures.size / Math.max(currentFeatures.size, providerFeatures.size)
    
    return {
      provider,
      similarity
    }
  })

  return similarityScores
    .filter(item => item.similarity > 0.2) // At least 20% feature overlap
    .sort((a, b) => b.similarity - a.similarity)
    .map(item => item.provider)
    .slice(0, 3)
}

/**
 * Get hardcoded popular comparisons
 */
function getPopularComparisons() {
  return [
    { label: 'AWS vs CoreWeave', url: '/compare/aws-vs-coreweave' },
    { label: 'AWS vs RunPod', url: '/compare/aws-vs-runpod' },
    { label: 'CoreWeave vs Lambda', url: '/compare/coreweave-vs-lambda' },
    { label: 'Google vs Azure', url: '/compare/google-vs-azure' },
    { label: 'RunPod vs Vast', url: '/compare/runpod-vs-vast' },
    { label: 'Lambda vs Vast', url: '/compare/lambda-vs-vast' },
    { label: 'AWS vs Google', url: '/compare/aws-vs-google' },
    { label: 'CoreWeave vs RunPod', url: '/compare/coreweave-vs-runpod' }
  ]
}