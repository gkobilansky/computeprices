import { siteConfig } from '@/app/metadata';
import { getProviderGPUCount } from '@/lib/utils/seoData';
import {
  getProviderBySlug as getProviderBySlugFromLib,
  getAllProviderSlugs as getAllProviderSlugsFromLib
} from '@/lib/providers';

// Re-export functions from lib/providers.ts for backward compatibility
export const getProviderBySlug = getProviderBySlugFromLib;
export const getAllProviderSlugs = getAllProviderSlugsFromLib;

export async function generateProviderMetadata(provider) {
  if (!provider) return {};

  // Get real GPU count and price data for this provider
  const gpuStats = await getProviderGPUCount(provider.id);
  const gpuCount = gpuStats.gpuCount;

  // Build dynamic title and description
  const priceInfo = gpuStats.lowestPrice ? ` from $${gpuStats.lowestPrice}/hr` : '';
  const gpuHighlights = gpuStats.gpuNames.slice(0, 3).join(', ');

  const title = `${provider.name} GPU Pricing: Compare ${gpuCount}+ GPUs | ComputePrices.com`;
  const description = gpuCount > 0
    ? `Compare ${provider.name} cloud GPU prices${priceInfo}. ${gpuCount}+ GPUs available including ${gpuHighlights}. Find the best rates for AI training and inference.`
    : `Compare ${provider.name} GPU prices and specifications. Find the best ${provider.name} cloud GPU deals for AI training, inference, and ML workloads.`;

  const path = `/providers/${provider.slug}`;

  // Generate keywords based on provider and GPU data
  const keywords = [
    provider.name,
    `${provider.name} GPU`,
    `${provider.name} pricing`,
    `${provider.name} cloud`,
    'GPU cloud',
    'cloud computing',
    'ML GPU',
    'AI GPU',
    'machine learning',
    'cloud GPU pricing',
    ...gpuStats.gpuNames.slice(0, 5),
    ...provider.features?.map(f => f.title) || [],
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${siteConfig.url}${path}`
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${path}`,
      siteName: siteConfig.name,
      images: [
        {
          url: provider.logo_url || '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${provider.name} Cloud GPU Comparison`,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [provider.logo_url || '/og-image.png'],
    },
    other: {
      'og:site_name': siteConfig.name,
      'og:type': 'website',
    },
  };
}

export function generateProviderSchema(provider, gpuPrices) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: provider.name,
    description: provider.description,
    url: provider.link,
    sameAs: [
      provider.link,
      provider.docsLink,
    ].filter(Boolean),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      offerCount: gpuPrices?.length || 0,
      offers: gpuPrices?.map(price => ({
        '@type': 'Offer',
        name: `${price.gpu_model_name} GPU Instance`,
        price: price.price_per_hour,
        priceCurrency: 'USD',
        priceValidUntil: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
        availability: 'https://schema.org/InStock',
      })) || [],
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${provider.name} GPU Instances`,
      itemListElement: provider.gpuServices?.map((service, index) => ({
        '@type': 'OfferCatalog',
        position: index + 1,
        name: service.name,
        description: service.description,
      })) || [],
    },
  };
} 