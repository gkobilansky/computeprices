import { Metadata } from 'next'
import { Provider } from '@/types/comparison'
import { siteConfig } from '@/app/metadata'
import { generateCanonicalComparisonURL } from '@/lib/providers'

/**
 * Generate dynamic metadata for comparison pages with SEO optimization
 */
export function generateComparisonMetadata({
  provider1,
  provider2,
  comparisonStats,
  currentPath
}: {
  provider1: Provider
  provider2: Provider
  comparisonStats?: {
    totalGPUs?: number
    bothAvailable?: number
    cheapestProvider?: string
    avgSavings?: number
  }
  currentPath: string
}): Metadata {
  const canonicalUrl = generateCanonicalComparisonURL(
    provider1.slug,
    provider2.slug,
    siteConfig.url
  )

  // Generate compelling title (under 60 chars)
  const title = `${provider1.name} vs ${provider2.name} GPU Cloud Pricing 2025`
  
  // Generate compelling description (150-160 chars)
  const baseDescription = `Compare ${provider1.name} and ${provider2.name} GPU cloud pricing, features, and performance. Real-time pricing data for AI training and inference workloads.`
  
  // Enhance description with stats if available
  const enhancedDescription = comparisonStats?.totalGPUs 
    ? `${baseDescription} Compare ${comparisonStats.totalGPUs} GPU models with ${comparisonStats.bothAvailable || 0} direct comparisons available.`
    : comparisonStats?.avgSavings
    ? `${baseDescription} Save up to ${Math.round(comparisonStats.avgSavings)}% on GPU cloud costs.`
    : baseDescription

  // Ensure description is within ideal length (150-160 chars)
  const finalDescription = enhancedDescription.length > 160 
    ? enhancedDescription.substring(0, 157) + '...'
    : enhancedDescription

  // Generate comprehensive keywords
  const keywords = generateComparisonKeywords(provider1, provider2, comparisonStats)

  return {
    title,
    description: finalDescription,
    keywords: keywords.join(', '),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: finalDescription,
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
      description: finalDescription,
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
      'article:tag': keywords.slice(0, 5).join(', '), // Limit to top 5 tags
      'og:site_name': siteConfig.name,
    },
  }
}

/**
 * Generate relevant keywords for comparison pages
 */
export function generateComparisonKeywords(
  provider1: Provider,
  provider2: Provider,
  comparisonStats?: {
    totalGPUs?: number
    bothAvailable?: number
    cheapestProvider?: string
    avgSavings?: number
  }
): string[] {
  const baseKeywords = [
    // Primary comparison terms
    `${provider1.name} vs ${provider2.name}`,
    `${provider1.name} ${provider2.name} comparison`,
    
    // Individual provider terms
    `${provider1.name} GPU pricing`,
    `${provider2.name} GPU pricing`,
    `${provider1.name} cloud GPU`,
    `${provider2.name} cloud GPU`,
    
    // Generic GPU cloud terms
    'GPU cloud comparison',
    'cloud GPU pricing',
    'GPU providers comparison',
    'AI training costs',
    'ML inference pricing',
    'cloud compute pricing',
    
    // Popular GPU models
    'H100 pricing comparison',
    'A100 pricing comparison',
    'RTX 4090 pricing',
    'GPU rental costs',
    
    // Use case keywords
    'AI workload pricing',
    'machine learning costs',
    'deep learning GPU',
    'neural network training',
    'LLM training costs',
    
    // Provider slugs for technical SEO
    provider1.slug.replace('-', ' '),
    provider2.slug.replace('-', ' ')
  ]

  // Add dynamic keywords based on stats
  if (comparisonStats) {
    if (comparisonStats.cheapestProvider) {
      baseKeywords.push(
        `cheapest GPU cloud`,
        `best GPU deals`,
        `${comparisonStats.cheapestProvider} discounts`
      )
    }
    
    if (comparisonStats.avgSavings && comparisonStats.avgSavings > 10) {
      baseKeywords.push(
        'GPU cost savings',
        'cheap GPU cloud',
        'affordable AI training'
      )
    }
  }

  // Remove duplicates and return unique keywords
  return Array.from(new Set(baseKeywords))
}

/**
 * Generate breadcrumb structured data for comparison pages
 */
export function generateComparisonBreadcrumbs(
  provider1: Provider,
  provider2: Provider
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': siteConfig.url
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Compare',
        'item': `${siteConfig.url}/compare`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': `${provider1.name} vs ${provider2.name}`,
        'item': generateCanonicalComparisonURL(provider1.slug, provider2.slug, siteConfig.url)
      }
    ]
  }
}

/**
 * Generate FAQ structured data for comparison pages
 */
export function generateComparisonFAQ(
  provider1: Provider,
  provider2: Provider,
  comparisonStats?: {
    totalGPUs?: number
    bothAvailable?: number
    cheapestProvider?: string
  }
) {
  const faqs = [
    {
      question: `What is the difference between ${provider1.name} and ${provider2.name}?`,
      answer: `${provider1.name} and ${provider2.name} are both cloud GPU providers offering different pricing models, features, and GPU availability. Use our comparison tool to see real-time pricing and feature differences.`
    },
    {
      question: `Which is cheaper: ${provider1.name} or ${provider2.name}?`,
      answer: comparisonStats?.cheapestProvider 
        ? `Based on current pricing data, ${comparisonStats.cheapestProvider} tends to offer more competitive rates for most GPU models.`
        : `Pricing varies by GPU model and usage requirements. Check our real-time comparison table to find the best deals for your specific needs.`
    },
    {
      question: `Can I switch between ${provider1.name} and ${provider2.name}?`,
      answer: `Yes, both providers offer flexible cloud GPU services. However, consider factors like data transfer costs, setup time, and specific features when switching between providers.`
    }
  ]

  if (comparisonStats?.totalGPUs) {
    faqs.push({
      question: `How many GPU models are available for comparison?`,
      answer: `We track pricing for ${comparisonStats.totalGPUs} different GPU models across both ${provider1.name} and ${provider2.name}, with ${comparisonStats.bothAvailable || 0} models available from both providers.`
    })
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  }
}

/**
 * Extract comparison metadata for SEO purposes
 */
export function extractComparisonStats(comparisonData: any[]): {
  totalGPUs: number
  bothAvailable: number
  cheapestProvider?: string
  avgSavings?: number
} | null {
  if (!comparisonData || comparisonData.length === 0) {
    return null
  }

  const totalGPUs = comparisonData.length
  const bothAvailable = comparisonData.filter(gpu => 
    gpu.provider1Price && gpu.provider2Price
  ).length

  // Calculate which provider is cheaper on average
  const provider1Wins = comparisonData.filter(gpu => 
    gpu.provider1Price && gpu.provider2Price && 
    parseFloat(gpu.provider1Price) < parseFloat(gpu.provider2Price)
  ).length

  const provider2Wins = comparisonData.filter(gpu => 
    gpu.provider1Price && gpu.provider2Price && 
    parseFloat(gpu.provider2Price) < parseFloat(gpu.provider1Price)
  ).length

  let cheapestProvider: string | undefined
  if (provider1Wins > provider2Wins) {
    cheapestProvider = comparisonData[0]?.provider1Name
  } else if (provider2Wins > provider1Wins) {
    cheapestProvider = comparisonData[0]?.provider2Name
  }

  // Calculate average savings percentage
  const savingsData = comparisonData
    .filter(gpu => gpu.provider1Price && gpu.provider2Price)
    .map(gpu => {
      const price1 = parseFloat(gpu.provider1Price)
      const price2 = parseFloat(gpu.provider2Price)
      return Math.abs(price1 - price2) / Math.max(price1, price2) * 100
    })

  const avgSavings = savingsData.length > 0 
    ? savingsData.reduce((sum, saving) => sum + saving, 0) / savingsData.length
    : undefined

  return {
    totalGPUs,
    bothAvailable,
    cheapestProvider,
    avgSavings
  }
}