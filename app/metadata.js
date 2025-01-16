// Base metadata configuration
export const siteConfig = {
  name: 'Compute Prices',
  url: 'https://computeprices.com',
  metadataBase: new URL('https://computeprices.com'),
  creator: 'Lansky Tech',
  twitterHandle: '@flowathletics',
  defaultDescription: 'Compare cloud GPU specifications and pricing to find the most cost-effective option for your machine learning workloads'
};

// Common metadata patterns
export const defaultMetadata = {
  metadataBase: siteConfig.metadataBase,
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
    google: 'your-google-verification-code',
  }
};

// Helper function to generate OpenGraph metadata
export function generateOpenGraph({ title, description, path = '', images = ['/og-image.png'] }) {
  return {
    title,
    description,
    url: `${siteConfig.url}${path}`,
    siteName: siteConfig.name,
    images: images.map(img => ({
      url: img,
      width: 1200,
      height: 630,
      alt: title,
    })),
    locale: 'en_US',
    type: 'website',
  };
}

// Helper function to generate Twitter metadata
export function generateTwitter({ title, description, images = ['/og-image.png'] }) {
  return {
    card: 'summary_large_image',
    title,
    description,
    images,
    creator: siteConfig.twitterHandle,
  };
}

// Helper function to generate structured data for providers
export function generateProviderStructuredData(providers) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'GPU Price Comparison Tool',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'AggregateOffer',
      offerCount: providers.length,
      availableDeliveryMethod: 'http://schema.org/OnlineDelivery',
      category: 'Cloud GPU Services',
      seller: {
        '@type': 'Organization',
        name: siteConfig.name
      }
    }
  };
} 