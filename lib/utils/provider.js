import providersData from '@/data/providers.json';
import { siteConfig } from '@/app/metadata';
import { fetchProviders } from '@/lib/utils/fetchGPUData';

export async function getProviderBySlug(slug) {
  // First try to find in JSON data
  const jsonProvider = providersData.find(p => p.slug === slug);
  if (jsonProvider) {
    return jsonProvider;
  }
  
  // If not found in JSON, try to find in database
  const dbProviders = await fetchProviders();
  const dbProvider = dbProviders.find(p => 
    p.name.toLowerCase().replace(/\s+/g, '-') === slug ||
    p.name.toLowerCase() === slug.replace(/-/g, ' ')
  );
  
  if (dbProvider) {
    // Return a minimal provider object for DB-only providers
    return {
      id: dbProvider.id,
      name: dbProvider.name,
      slug: slug,
      description: "We're still gathering detailed info on this provider.",
      features: [],
      pros: [],
      cons: [],
      gettingStarted: [],
      isMinimal: true
    };
  }
  
  return null;
}

export async function getAllProviderSlugs() {
  const jsonSlugs = providersData.map(provider => provider.slug);
  
  // Also get slugs from database providers
  const dbProviders = await fetchProviders();
  const dbSlugs = dbProviders
    .filter(p => !providersData.find(jp => jp.id === p.id)) // Only DB-only providers
    .map(p => p.name.toLowerCase().replace(/\s+/g, '-'));
  
  return [...jsonSlugs, ...dbSlugs];
}

export async function generateProviderMetadata(provider) {
  if (!provider) return {};

  const title = `${provider.name} GPU Pricing & Specs | ComputePrices.com`;
  const description = `Compare ${provider.name} GPU prices and specifications. Find the best ${provider.name} cloud GPU deals for AI training, inference, and ML workloads. Save up to 80% on cloud compute costs.`;
  const path = `/providers/${provider.slug}`;

  const keywords = [
    provider.name,
    'GPU cloud',
    'cloud computing',
    'ML GPU',
    'AI GPU',
    'machine learning',
    'cloud GPU pricing',
    provider.name + ' pricing',
    provider.name + ' GPU',
    ...provider.features?.map(f => f.title) || [],
  ];

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