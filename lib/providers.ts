import providersData from '@/data/providers.json'
import { fetchProviders } from '@/lib/utils/fetchGPUData'
import {
  Provider,
  ParsedProviderSlugs,
  ProviderURLFormat,
  ProviderValidationResult,
  ComparisonValidationResult,
  ComparisonError
} from '@/types/comparison'

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
 * Get provider by slug from JSON data first, then database if needed
 */
export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const normalizedSlug = normalizeProviderSlug(slug)
  
  // First try to find in JSON data
  const jsonProvider = providersData.find(p => p.slug === normalizedSlug)
  if (jsonProvider) {
    return jsonProvider as Provider
  }
  
  // If not found in JSON, try to find in database
  try {
    const dbProviders = await fetchProviders()
    const dbProvider = dbProviders.find(p => 
      normalizeProviderSlug(p.name) === normalizedSlug ||
      p.name.toLowerCase() === normalizedSlug.replace(/-/g, ' ')
    )
    
    if (dbProvider) {
      // Return a minimal provider object for DB-only providers
      return {
        id: dbProvider.id,
        name: dbProvider.name,
        slug: normalizedSlug,
        description: "We're still gathering detailed info on this provider.",
        features: [],
        pros: [],
        cons: [],
        gettingStarted: [],
        isMinimal: true
      }
    }
  } catch (error) {
    console.error('Error fetching providers from database:', error)
  }
  
  return null
}

/**
 * Validate that a provider slug exists and return the provider data
 */
export async function validateProviderSlug(slug: string): Promise<ProviderValidationResult> {
  if (!slug || typeof slug !== 'string') {
    return {
      isValid: false,
      error: 'Provider slug is required and must be a string'
    }
  }

  const normalizedSlug = normalizeProviderSlug(slug)
  
  if (normalizedSlug.length === 0) {
    return {
      isValid: false,
      error: 'Provider slug cannot be empty after normalization'
    }
  }

  try {
    const provider = await getProviderBySlug(normalizedSlug)
    
    if (!provider) {
      return {
        isValid: false,
        error: `Provider with slug '${normalizedSlug}' not found`
      }
    }

    return {
      isValid: true,
      provider
    }
  } catch (error) {
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

  // Validate both providers
  const [validation1, validation2] = await Promise.all([
    validateProviderSlug(provider1Slug),
    validateProviderSlug(provider2Slug)
  ])

  if (!validation1.isValid) {
    return {
      isValid: false,
      error: `Provider 1 validation failed: ${validation1.error}`,
      errorType: 'PROVIDER_NOT_FOUND'
    }
  }

  if (!validation2.isValid) {
    return {
      isValid: false,
      error: `Provider 2 validation failed: ${validation2.error}`,
      errorType: 'PROVIDER_NOT_FOUND'
    }
  }

  return {
    isValid: true,
    provider1: validation1.provider!,
    provider2: validation2.provider!
  }
}

/**
 * Get all available provider slugs for route generation
 */
export async function getAllProviderSlugs(): Promise<string[]> {
  const jsonSlugs = providersData.map(provider => provider.slug)
  
  try {
    // Also get slugs from database providers
    const dbProviders = await fetchProviders()
    const dbSlugs = dbProviders
      .filter(p => !providersData.find(jp => jp.id === p.id)) // Only DB-only providers
      .map(p => normalizeProviderSlug(p.name))
    
    return [...jsonSlugs, ...dbSlugs]
  } catch (error) {
    console.error('Error fetching database provider slugs:', error)
    return jsonSlugs
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