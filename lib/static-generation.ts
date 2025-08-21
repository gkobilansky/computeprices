import { getAllProviderSlugs, normalizeProviderSlug } from '@/lib/providers'

/**
 * Configuration for static generation
 */
export interface StaticGenerationConfig {
  maxProviders?: number
  includeAllCombinations?: boolean
  priorityProviders?: string[]
  excludeProviders?: string[]
}

/**
 * Default configuration for static generation
 */
export const DEFAULT_STATIC_CONFIG: StaticGenerationConfig = {
  maxProviders: 50,
  includeAllCombinations: true,
  priorityProviders: ['aws', 'azure', 'google', 'coreweave', 'runpod', 'lambda'],
  excludeProviders: []
}

/**
 * Generate all valid provider comparison combinations
 */
export async function generateProviderCombinations(
  config: StaticGenerationConfig = DEFAULT_STATIC_CONFIG
): Promise<Array<{ providers: string[] }>> {
  try {
    const allSlugs = await getAllProviderSlugs()
    
    // Filter out excluded providers
    const filteredSlugs = allSlugs.filter(slug => 
      !config.excludeProviders?.includes(slug)
    )
    
    // Apply max providers limit
    const limitedSlugs = config.maxProviders 
      ? filteredSlugs.slice(0, config.maxProviders)
      : filteredSlugs
    
    const combinations: Array<{ providers: string[] }> = []
    
    if (!config.includeAllCombinations) {
      // Only generate combinations with priority providers
      const prioritySet = new Set(config.priorityProviders || [])
      
      for (let i = 0; i < limitedSlugs.length; i++) {
        for (let j = i + 1; j < limitedSlugs.length; j++) {
          const slug1 = limitedSlugs[i]
          const slug2 = limitedSlugs[j]
          
          // Only include if at least one provider is in priority list
          if (prioritySet.has(slug1) || prioritySet.has(slug2)) {
            const [first, second] = [slug1, slug2].sort()
            combinations.push({
              providers: [`${first}-vs-${second}`]
            })
          }
        }
      }
    } else {
      // Generate all possible combinations
      for (let i = 0; i < limitedSlugs.length; i++) {
        for (let j = i + 1; j < limitedSlugs.length; j++) {
          const slug1 = limitedSlugs[i]
          const slug2 = limitedSlugs[j]
          
          // Always use alphabetical order for canonical URLs
          const [first, second] = [slug1, slug2].sort()
          combinations.push({
            providers: [`${first}-vs-${second}`]
          })
        }
      }
    }
    
    // Sort combinations for deterministic build output
    combinations.sort((a, b) => a.providers[0].localeCompare(b.providers[0]))
    
    console.log(`[Static Generation] Generated ${combinations.length} provider combinations from ${limitedSlugs.length} providers`)
    
    return combinations
    
  } catch (error) {
    console.error('[Static Generation] Error generating provider combinations:', error)
    
    // Fallback: generate combinations for hardcoded popular providers
    const fallbackProviders = ['aws', 'azure', 'google', 'coreweave', 'runpod', 'lambda']
    const fallbackCombinations: Array<{ providers: string[] }> = []
    
    for (let i = 0; i < fallbackProviders.length; i++) {
      for (let j = i + 1; j < fallbackProviders.length; j++) {
        const [first, second] = [fallbackProviders[i], fallbackProviders[j]].sort()
        fallbackCombinations.push({
          providers: [`${first}-vs-${second}`]
        })
      }
    }
    
    console.warn(`[Static Generation] Using fallback: ${fallbackCombinations.length} combinations`)
    return fallbackCombinations
  }
}

/**
 * Generate provider combinations with build time limit
 * This function respects build time constraints and generates the most important combinations first
 */
export async function generateStaticParamsWithLimit(
  maxCombinations: number = 100,
  config: StaticGenerationConfig = DEFAULT_STATIC_CONFIG
): Promise<Array<{ providers: string[] }>> {
  try {
    const allCombinations = await generateProviderCombinations(config)
    
    if (allCombinations.length <= maxCombinations) {
      return allCombinations
    }
    
    // Priority-based selection when we need to limit combinations
    const priorityProviders = config.priorityProviders || []
    const prioritySet = new Set(priorityProviders)
    
    // Sort combinations by priority (both providers in priority list first, then one provider, then others)
    const sortedCombinations = allCombinations.sort((a, b) => {
      const aProviders = a.providers[0].split('-vs-')
      const bProviders = b.providers[0].split('-vs-')
      
      const aPriorityCount = aProviders.filter(p => prioritySet.has(p)).length
      const bPriorityCount = bProviders.filter(p => prioritySet.has(p)).length
      
      // Sort by priority count (descending), then alphabetically
      if (aPriorityCount !== bPriorityCount) {
        return bPriorityCount - aPriorityCount
      }
      
      return a.providers[0].localeCompare(b.providers[0])
    })
    
    const limitedCombinations = sortedCombinations.slice(0, maxCombinations)
    
    console.log(`[Static Generation] Limited to ${limitedCombinations.length} combinations (from ${allCombinations.length} total) for build time optimization`)
    
    return limitedCombinations
    
  } catch (error) {
    console.error('[Static Generation] Error generating limited static params:', error)
    return []
  }
}

/**
 * Validate if a provider combination should be statically generated
 */
export function shouldGenerateStaticPage(
  provider1Slug: string,
  provider2Slug: string,
  config: StaticGenerationConfig = DEFAULT_STATIC_CONFIG
): boolean {
  const normalizedSlug1 = normalizeProviderSlug(provider1Slug)
  const normalizedSlug2 = normalizeProviderSlug(provider2Slug)
  
  // Check if providers are excluded
  if (config.excludeProviders?.includes(normalizedSlug1) || 
      config.excludeProviders?.includes(normalizedSlug2)) {
    return false
  }
  
  // If not generating all combinations, check priority
  if (!config.includeAllCombinations) {
    const prioritySet = new Set(config.priorityProviders || [])
    return prioritySet.has(normalizedSlug1) || prioritySet.has(normalizedSlug2)
  }
  
  return true
}

/**
 * Get static generation metadata for monitoring and debugging
 */
export async function getStaticGenerationMetadata(): Promise<{
  totalProviders: number
  totalCombinations: number
  priorityProviders: string[]
  buildTimestamp: string
}> {
  const allSlugs = await getAllProviderSlugs()
  const totalCombinations = (allSlugs.length * (allSlugs.length - 1)) / 2
  
  return {
    totalProviders: allSlugs.length,
    totalCombinations,
    priorityProviders: DEFAULT_STATIC_CONFIG.priorityProviders || [],
    buildTimestamp: new Date().toISOString()
  }
}

/**
 * Production-optimized configuration for static generation
 * Balances SEO coverage with build time constraints
 */
export const PRODUCTION_STATIC_CONFIG: StaticGenerationConfig = {
  maxProviders: 30,
  includeAllCombinations: false, // Only priority combinations for faster builds
  priorityProviders: [
    'aws', 'azure', 'google', 'coreweave', 'runpod', 'lambda', 
    'datacrunch', 'fluidstack', 'hyperstack', 'shadeform'
  ],
  excludeProviders: []
}

/**
 * Development configuration for testing
 */
export const DEVELOPMENT_STATIC_CONFIG: StaticGenerationConfig = {
  maxProviders: 10,
  includeAllCombinations: true,
  priorityProviders: ['aws', 'coreweave', 'runpod'],
  excludeProviders: []
}