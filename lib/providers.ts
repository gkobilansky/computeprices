import { fetchProviders } from '@/lib/utils/fetchGPUData'
import {
  Provider,
  ParsedProviderSlugs,
  ProviderURLFormat,
  ProviderValidationResult,
  ComparisonValidationResult,
  ComparisonError
} from '@/types/comparison'

// Cache for provider validation results (5 minute TTL)
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const providerCache = new Map<string, {
  provider: Provider | null
  timestamp: number
}>()

// Cache for all provider slugs
let providerSlugsCache: {
  slugs: string[]
  timestamp: number
} | null = null

// Cache for all providers from database
let allProvidersCache: {
  providers: any[]
  timestamp: number
} | null = null

/**
 * Transform database row to Provider object
 */
function transformDBRowToProvider(dbRow: any): Provider {
  const metadata = dbRow.metadata || {}

  return {
    id: dbRow.id,
    name: dbRow.name,
    slug: dbRow.slug,
    link: dbRow.website,
    description: dbRow.description || "We're still gathering detailed info on this provider.",
    docsLink: dbRow.docs_link,
    category: dbRow.category,
    tagline: dbRow.tagline,
    hqCountry: dbRow.hq_country,
    tags: dbRow.tags || [],
    features: metadata.features || [],
    pros: metadata.pros || [],
    cons: metadata.cons || [],
    gettingStarted: metadata.gettingStarted || [],
    computeServices: metadata.computeServices || [],
    gpuServices: metadata.gpuServices || [],
    pricingOptions: metadata.pricingOptions || [],
    uniqueSellingPoints: metadata.uniqueSellingPoints || [],
    regions: metadata.regions,
    support: metadata.support
  }
}

/**
 * Get all providers from database with caching
 */
async function getAllProvidersFromDB(): Promise<any[]> {
  const now = Date.now()

  // Check cache first
  if (allProvidersCache && (now - allProvidersCache.timestamp) < CACHE_TTL) {
    return allProvidersCache.providers
  }

  try {
    const providers = await fetchProviders()

    // Cache the result
    allProvidersCache = {
      providers,
      timestamp: now
    }

    return providers
  } catch (error) {
    console.error('Error fetching providers from database:', error)
    // Return empty array on error, but don't cache it
    return []
  }
}

/**
 * Normalize a provider slug by converting to lowercase and replacing spaces with hyphens
 */
export function normalizeProviderSlug(slug: string): string {
  return slug.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Parse provider slugs from URL segments supporting multiple formats:
 * - aws-vs-coreweave
 * - aws/vs/coreweave  
 * - aws,coreweave
 */
export function parseProviderSlugs(providers: string[]): ParsedProviderSlugs {
  if (!providers || providers.length === 0) {
    return {
      provider1: '',
      provider2: '',
      isValid: false,
      format: ProviderURLFormat.INVALID,
      error: 'No provider segments provided'
    }
  }

  // Join all segments to handle different formats
  const joinedPath = providers.join('/')
  
  // Format 1: aws-vs-coreweave (single segment with -vs-)
  if (joinedPath.includes('-vs-')) {
    const parts = joinedPath.split('-vs-')
    if (parts.length === 2) {
      return {
        provider1: normalizeProviderSlug(parts[0]),
        provider2: normalizeProviderSlug(parts[1]),
        isValid: true,
        format: ProviderURLFormat.DASH_VS
      }
    }
  }

  // Format 2: aws/vs/coreweave (three segments with 'vs' in middle)
  if (providers.length === 3 && providers[1] === 'vs') {
    return {
      provider1: normalizeProviderSlug(providers[0]),
      provider2: normalizeProviderSlug(providers[2]),
      isValid: true,
      format: ProviderURLFormat.SLASH_VS
    }
  }

  // Format 3: aws,coreweave (single segment with comma)
  if (joinedPath.includes(',')) {
    const parts = joinedPath.split(',')
    if (parts.length === 2) {
      return {
        provider1: normalizeProviderSlug(parts[0]),
        provider2: normalizeProviderSlug(parts[1]),
        isValid: true,
        format: ProviderURLFormat.COMMA
      }
    }
  }

  // Format 4: Two separate segments (aws/coreweave)
  if (providers.length === 2) {
    return {
      provider1: normalizeProviderSlug(providers[0]),
      provider2: normalizeProviderSlug(providers[1]),
      isValid: true,
      format: ProviderURLFormat.SLASH_VS
    }
  }

  return {
    provider1: '',
    provider2: '',
    isValid: false,
    format: ProviderURLFormat.INVALID,
    error: `Invalid provider URL format. Expected formats: aws-vs-coreweave, aws/vs/coreweave, aws,coreweave, or aws/coreweave`
  }
}

/**
 * Get provider by slug from database (with caching)
 */
export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const normalizedSlug = normalizeProviderSlug(slug)

  // Check cache first
  const cacheKey = `provider:${normalizedSlug}`
  const cached = providerCache.get(cacheKey)
  const now = Date.now()

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.provider
  }

  // Fetch from database
  try {
    const dbProviders = await getAllProvidersFromDB()
    const dbProvider = dbProviders.find(p =>
      p.slug === normalizedSlug ||
      normalizeProviderSlug(p.slug || '') === normalizedSlug
    )

    if (dbProvider) {
      // Transform DB row to Provider object
      const provider = transformDBRowToProvider(dbProvider)

      // Cache the result
      providerCache.set(cacheKey, {
        provider,
        timestamp: now
      })
      return provider
    }
  } catch (error) {
    console.error('Error fetching provider from database:', error)
  }

  // Cache null result too to avoid repeated DB queries for invalid providers
  providerCache.set(cacheKey, {
    provider: null,
    timestamp: now
  })

  return null
}

/**
 * Validate that a provider slug exists and return the provider data
 */
export async function validateProviderSlug(slug: string): Promise<ProviderValidationResult> {
  const startTime = Date.now()
  
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('[Provider Validation] Invalid slug type:', { slug, type: typeof slug })
      return {
        isValid: false,
        error: 'Provider slug is required and must be a string'
      }
    }

    const normalizedSlug = normalizeProviderSlug(slug)
    
    if (normalizedSlug.length === 0) {
      console.warn('[Provider Validation] Empty slug after normalization:', { originalSlug: slug })
      return {
        isValid: false,
        error: 'Provider slug cannot be empty after normalization'
      }
    }

    const provider = await getProviderBySlug(normalizedSlug)
    const duration = Date.now() - startTime
    
    if (!provider) {
      console.info('[Provider Validation] Provider not found:', { 
        slug: normalizedSlug, 
        originalSlug: slug,
        duration: `${duration}ms`
      })
      return {
        isValid: false,
        error: `Provider with slug '${normalizedSlug}' not found`
      }
    }

    console.debug('[Provider Validation] Success:', { 
      slug: normalizedSlug,
      providerName: provider.name,
      duration: `${duration}ms`
    })

    return {
      isValid: true,
      provider
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[Provider Validation] Unexpected error:', { 
      slug,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    })
    
    return {
      isValid: false,
      error: `Error validating provider: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validate a complete provider comparison
 */
export async function validateProviderComparison(
  provider1Slug: string,
  provider2Slug: string
): Promise<ComparisonValidationResult> {
  const startTime = Date.now()
  
  try {
    console.debug('[Comparison Validation] Starting:', { 
      provider1Slug, 
      provider2Slug 
    })

    // Check if slugs are the same
    const normalizedSlug1 = normalizeProviderSlug(provider1Slug)
    const normalizedSlug2 = normalizeProviderSlug(provider2Slug)
    
    if (normalizedSlug1 === normalizedSlug2) {
      console.warn('[Comparison Validation] Same provider comparison attempted:', { 
        provider1Slug, 
        provider2Slug, 
        normalizedSlug: normalizedSlug1 
      })
      return {
        isValid: false,
        error: 'Cannot compare a provider with itself',
        errorType: 'SAME_PROVIDER'
      }
    }

    // Validate both providers
    const [validation1, validation2] = await Promise.all([
      validateProviderSlug(provider1Slug),
      validateProviderSlug(provider2Slug)
    ])

    const duration = Date.now() - startTime

    if (!validation1.isValid) {
      console.info('[Comparison Validation] Provider 1 invalid:', { 
        provider1Slug,
        provider2Slug,
        error: validation1.error,
        duration: `${duration}ms`
      })
      return {
        isValid: false,
        error: `Provider 1 validation failed: ${validation1.error}`,
        errorType: 'PROVIDER_NOT_FOUND'
      }
    }

    if (!validation2.isValid) {
      console.info('[Comparison Validation] Provider 2 invalid:', { 
        provider1Slug,
        provider2Slug,
        error: validation2.error,
        duration: `${duration}ms`
      })
      return {
        isValid: false,
        error: `Provider 2 validation failed: ${validation2.error}`,
        errorType: 'PROVIDER_NOT_FOUND'
      }
    }

    console.debug('[Comparison Validation] Success:', { 
      provider1: validation1.provider!.name,
      provider2: validation2.provider!.name,
      duration: `${duration}ms`
    })

    return {
      isValid: true,
      provider1: validation1.provider!,
      provider2: validation2.provider!
    }
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('[Comparison Validation] Unexpected error:', {
      provider1Slug,
      provider2Slug,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`
    })
    
    return {
      isValid: false,
      error: `Unexpected error during comparison validation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errorType: 'UNKNOWN'
    }
  }
}

/**
 * Get all available provider slugs for route generation (with caching)
 */
export async function getAllProviderSlugs(): Promise<string[]> {
  const now = Date.now()

  // Check cache first
  if (providerSlugsCache && (now - providerSlugsCache.timestamp) < CACHE_TTL) {
    return providerSlugsCache.slugs
  }

  try {
    // Get all slugs from database
    const dbProviders = await getAllProvidersFromDB()
    const slugs = dbProviders
      .filter(p => p.slug) // Only include providers with slugs
      .map(p => p.slug)

    // Cache the result
    providerSlugsCache = {
      slugs,
      timestamp: now
    }

    return slugs
  } catch (error) {
    console.error('Error fetching database provider slugs:', error)

    // Return empty array on error, but don't cache it
    return []
  }
}

/**
 * Generate canonical URL for bidirectional comparison
 * Always puts providers in alphabetical order for consistency
 */
export function generateCanonicalComparisonURL(
  provider1Slug: string,
  provider2Slug: string,
  baseUrl: string = ''
): string {
  const slug1 = normalizeProviderSlug(provider1Slug)
  const slug2 = normalizeProviderSlug(provider2Slug)
  
  // Sort alphabetically for canonical URL
  const [firstSlug, secondSlug] = [slug1, slug2].sort()
  
  return `${baseUrl}/compare/${firstSlug}-vs-${secondSlug}`
}

/**
 * Check if current URL matches canonical format and return redirect if needed
 */
export function getCanonicalRedirectURL(
  provider1Slug: string,
  provider2Slug: string,
  currentPath: string,
  baseUrl: string = ''
): string | null {
  const canonicalURL = generateCanonicalComparisonURL(provider1Slug, provider2Slug, baseUrl)
  const currentURL = `${baseUrl}${currentPath}`
  
  return canonicalURL !== currentURL ? canonicalURL : null
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Generate provider suggestions for invalid slugs
 */
export async function generateProviderSuggestions(
  invalidSlug: string, 
  maxSuggestions: number = 5
): Promise<Array<{slug: string, name: string, similarity: number}>> {
  const normalizedInput = normalizeProviderSlug(invalidSlug)
  
  if (!normalizedInput || normalizedInput.length === 0) {
    return []
  }

  try {
    // Get all available providers from database
    const dbProviders = await getAllProvidersFromDB()
    const suggestions: Array<{slug: string, name: string, similarity: number}> = []

    // Calculate similarity for each provider (both slug and name)
    for (const dbProvider of dbProviders) {
      if (!dbProvider.slug) continue

      const slugSimilarity = calculateSimilarity(normalizedInput, dbProvider.slug)
      const nameSlug = normalizeProviderSlug(dbProvider.name)
      const nameSimilarity = calculateSimilarity(normalizedInput, nameSlug)

      // Use the best similarity score
      const bestSimilarity = Math.max(slugSimilarity, nameSimilarity)

      // Only include suggestions with reasonable similarity (>= 0.3)
      if (bestSimilarity >= 0.3) {
        suggestions.push({
          slug: dbProvider.slug,
          name: dbProvider.name,
          similarity: bestSimilarity
        })
      }
    }

    // Sort by similarity (highest first) and return top suggestions
    return suggestions
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxSuggestions)

  } catch (error) {
    console.error('Error generating provider suggestions:', error)
    return []
  }
}

/**
 * Enhanced provider validation with suggestions for invalid providers
 */
export async function validateProviderSlugWithSuggestions(
  slug: string
): Promise<ProviderValidationResult & {suggestions?: Array<{slug: string, name: string, similarity: number}>}> {
  const baseValidation = await validateProviderSlug(slug)
  
  if (baseValidation.isValid) {
    return baseValidation
  }
  
  // Generate suggestions for invalid provider
  const suggestions = await generateProviderSuggestions(slug)
  
  return {
    ...baseValidation,
    suggestions
  }
}

/**
 * Enhanced comparison validation with suggestions
 */
export async function validateProviderComparisonWithSuggestions(
  provider1Slug: string,
  provider2Slug: string
): Promise<ComparisonValidationResult & {
  provider1Suggestions?: Array<{slug: string, name: string, similarity: number}>
  provider2Suggestions?: Array<{slug: string, name: string, similarity: number}>
}> {
  // Check if slugs are the same
  const normalizedSlug1 = normalizeProviderSlug(provider1Slug)
  const normalizedSlug2 = normalizeProviderSlug(provider2Slug)
  
  if (normalizedSlug1 === normalizedSlug2) {
    return {
      isValid: false,
      error: 'Cannot compare a provider with itself',
      errorType: 'SAME_PROVIDER'
    }
  }

  // Validate both providers with suggestions
  const [validation1, validation2] = await Promise.all([
    validateProviderSlugWithSuggestions(provider1Slug),
    validateProviderSlugWithSuggestions(provider2Slug)
  ])

  const result: ComparisonValidationResult & {
    provider1Suggestions?: Array<{slug: string, name: string, similarity: number}>
    provider2Suggestions?: Array<{slug: string, name: string, similarity: number}>
  } = {
    isValid: true
  }

  if (!validation1.isValid) {
    result.isValid = false
    result.error = `Provider '${provider1Slug}' not found`
    result.errorType = 'PROVIDER_NOT_FOUND'
    result.provider1Suggestions = validation1.suggestions
  }

  if (!validation2.isValid) {
    result.isValid = false
    if (result.error) {
      result.error += ` and provider '${provider2Slug}' not found`
    } else {
      result.error = `Provider '${provider2Slug}' not found`
      result.errorType = 'PROVIDER_NOT_FOUND'
    }
    result.provider2Suggestions = validation2.suggestions
  }

  if (result.isValid) {
    result.provider1 = validation1.provider!
    result.provider2 = validation2.provider!
  }

  return result
}

/**
 * Utility to throw typed comparison errors
 */
export function throwComparisonError(
  message: string,
  errorType: ComparisonValidationResult['errorType'],
  provider1Slug?: string,
  provider2Slug?: string
): never {
  throw new ComparisonError(message, errorType, provider1Slug, provider2Slug)
}