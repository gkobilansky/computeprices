import { Provider } from '@/types/comparison'
import { siteConfig } from '@/app/metadata'
import { generateCanonicalComparisonURL } from '@/lib/providers'

/**
 * Generate ComparisonShopping structured data for comparison pages
 */
export function generateComparisonShoppingStructuredData(
  provider1: Provider,
  provider2: Provider,
  comparisonData: any[]
) {
  const canonicalUrl = generateCanonicalComparisonURL(
    provider1.slug,
    provider2.slug,
    siteConfig.url
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'ComparisonShopping',
    'name': `${provider1.name} vs ${provider2.name} GPU Pricing Comparison`,
    'description': `Compare GPU cloud pricing between ${provider1.name} and ${provider2.name}. Real-time pricing data for AI training and inference workloads.`,
    'url': canonicalUrl,
    'dateModified': new Date().toISOString(),
    'author': {
      '@type': 'Organization',
      'name': siteConfig.name,
      'url': siteConfig.url
    },
    'provider': [
      generateProviderOrganizationSchema(provider1),
      generateProviderOrganizationSchema(provider2)
    ],
    'itemListElement': comparisonData.slice(0, 10).map((gpu, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'item': generateGPUProductSchema(gpu, provider1, provider2)
    }))
  }
}

/**
 * Generate Organization schema for cloud providers
 */
export function generateProviderOrganizationSchema(provider: Provider) {
  return {
    '@type': 'Organization',
    'name': provider.name,
    'description': provider.description || `${provider.name} cloud GPU services`,
    'url': `${siteConfig.url}/providers/${provider.slug}`,
    'sameAs': generateProviderSameAsLinks(provider),
    'offers': {
      '@type': 'Offer',
      'category': 'Cloud GPU Services',
      'availableDeliveryMethod': 'http://schema.org/OnlineDelivery',
      'businessFunction': 'http://schema.org/Sell',
      'itemOffered': {
        '@type': 'Service',
        'name': 'Cloud GPU Rental',
        'category': 'Cloud Computing'
      }
    }
  }
}

/**
 * Generate Product schema for GPU offerings
 */
export function generateGPUProductSchema(
  gpu: any,
  provider1: Provider,
  provider2: Provider
) {
  const product = {
    '@type': 'Product',
    'name': gpu.gpu_name || gpu.name,
    'category': 'Graphics Processing Unit',
    'description': `${gpu.gpu_name || gpu.name} cloud GPU rental pricing comparison`,
    'brand': {
      '@type': 'Brand',
      'name': gpu.manufacturer || 'NVIDIA'
    }
  }

  // Add offers from both providers if available
  const offers = []
  
  if (gpu.provider1Price) {
    offers.push({
      '@type': 'Offer',
      'seller': {
        '@type': 'Organization',
        'name': provider1.name
      },
      'price': gpu.provider1Price,
      'priceCurrency': 'USD',
      'priceValidUntil': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      'availability': 'http://schema.org/InStock',
      'url': `${siteConfig.url}/providers/${provider1.slug}`,
      'priceSpecification': {
        '@type': 'UnitPriceSpecification',
        'price': gpu.provider1Price,
        'priceCurrency': 'USD',
        'unitText': 'per hour'
      }
    })
  }

  if (gpu.provider2Price) {
    offers.push({
      '@type': 'Offer',
      'seller': {
        '@type': 'Organization',
        'name': provider2.name
      },
      'price': gpu.provider2Price,
      'priceCurrency': 'USD',
      'priceValidUntil': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      'availability': 'http://schema.org/InStock',
      'url': `${siteConfig.url}/providers/${provider2.slug}`,
      'priceSpecification': {
        '@type': 'UnitPriceSpecification',
        'price': gpu.provider2Price,
        'priceCurrency': 'USD',
        'unitText': 'per hour'
      }
    })
  }

  if (offers.length > 0) {
    const productWithOffers: any = product
    productWithOffers.offers = offers.length === 1 ? offers[0] : {
      '@type': 'AggregateOffer',
      'offerCount': offers.length,
      'offers': offers,
      'lowPrice': Math.min(...offers.map(o => parseFloat(o.price))),
      'highPrice': Math.max(...offers.map(o => parseFloat(o.price))),
      'priceCurrency': 'USD'
    }
    return productWithOffers
  }

  return product
}

/**
 * Generate WebPage structured data for comparison pages
 */
export function generateWebPageStructuredData(
  provider1: Provider,
  provider2: Provider
) {
  const canonicalUrl = generateCanonicalComparisonURL(
    provider1.slug,
    provider2.slug,
    siteConfig.url
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    'name': `${provider1.name} vs ${provider2.name} GPU Pricing Comparison`,
    'description': `Compare ${provider1.name} and ${provider2.name} GPU cloud pricing, features, and performance.`,
    'url': canonicalUrl,
    'inLanguage': 'en-US',
    'isPartOf': {
      '@type': 'WebSite',
      'name': siteConfig.name,
      'url': siteConfig.url
    },
    'author': {
      '@type': 'Organization',
      'name': siteConfig.name,
      'url': siteConfig.url
    },
    'publisher': {
      '@type': 'Organization',
      'name': siteConfig.name,
      'url': siteConfig.url
    },
    'dateModified': new Date().toISOString(),
    'mainEntity': {
      '@type': 'Table',
      'name': 'GPU Pricing Comparison',
      'description': `Comparison of GPU pricing between ${provider1.name} and ${provider2.name}`
    }
  }
}

/**
 * Generate ItemList structured data for comparison results
 */
export function generateComparisonItemListStructuredData(
  provider1: Provider,
  provider2: Provider,
  comparisonData: any[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${provider1.name} vs ${provider2.name} GPU Comparison Results`,
    'description': `List of GPU pricing comparisons between ${provider1.name} and ${provider2.name}`,
    'numberOfItems': comparisonData.length,
    'itemListElement': comparisonData.map((gpu, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': gpu.gpu_name || gpu.name,
      'item': {
        '@type': 'Product',
        'name': gpu.gpu_name || gpu.name,
        'category': 'Cloud GPU'
      }
    }))
  }
}

/**
 * Generate Review structured data for provider comparison
 */
export function generateComparisonReviewStructuredData(
  provider1: Provider,
  provider2: Provider,
  comparisonStats?: {
    totalGPUs: number
    bothAvailable: number
    cheapestProvider?: string
  }
) {
  const canonicalUrl = generateCanonicalComparisonURL(
    provider1.slug,
    provider2.slug,
    siteConfig.url
  )

  let reviewBody = `Comprehensive comparison of ${provider1.name} and ${provider2.name} cloud GPU services.`
  
  if (comparisonStats) {
    reviewBody += ` Analysis covers ${comparisonStats.totalGPUs} GPU models with ${comparisonStats.bothAvailable} direct comparisons available.`
    if (comparisonStats.cheapestProvider) {
      reviewBody += ` ${comparisonStats.cheapestProvider} offers more competitive pricing for most GPU models.`
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    'itemReviewed': {
      '@type': 'Service',
      'name': `${provider1.name} vs ${provider2.name} Cloud GPU Services`
    },
    'author': {
      '@type': 'Organization',
      'name': siteConfig.name
    },
    'datePublished': new Date().toISOString(),
    'reviewBody': reviewBody,
    'url': canonicalUrl
  }
}

/**
 * Generate SameAs links for providers (if we have social media data)
 */
function generateProviderSameAsLinks(provider: Provider): string[] {
  const sameAs: string[] = []
  
  // Add provider's main page URL
  sameAs.push(`${siteConfig.url}/providers/${provider.slug}`)
  
  // Add common social media patterns (these would ideally come from provider data)
  const providerName = provider.name.toLowerCase().replace(/\s+/g, '')
  
  // Common social media patterns for tech companies
  const socialMediaPatterns = [
    `https://twitter.com/${providerName}`,
    `https://github.com/${providerName}`,
    `https://linkedin.com/company/${providerName}`
  ]
  
  // Only add these if they follow common patterns (in reality, we'd want real URLs)
  // For now, just return the provider page
  return sameAs
}

/**
 * Combine all structured data for a comparison page
 */
export function generateComparisonStructuredData(
  provider1: Provider,
  provider2: Provider,
  comparisonData: any[] = [],
  comparisonStats?: {
    totalGPUs: number
    bothAvailable: number
    cheapestProvider?: string
  }
) {
  return {
    comparisonShopping: generateComparisonShoppingStructuredData(provider1, provider2, comparisonData),
    webPage: generateWebPageStructuredData(provider1, provider2),
    itemList: generateComparisonItemListStructuredData(provider1, provider2, comparisonData),
    organizations: [
      generateProviderOrganizationSchema(provider1),
      generateProviderOrganizationSchema(provider2)
    ],
    review: generateComparisonReviewStructuredData(provider1, provider2, comparisonStats)
  }
}

/**
 * Generate JSON-LD script tag content
 */
export function generateJSONLD(structuredData: any): string {
  return JSON.stringify(structuredData, null, 0)
}