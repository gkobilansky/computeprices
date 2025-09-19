import type { Metadata } from 'next';

// Base metadata configuration
export const siteConfig = {
  name: 'Compute Prices',
  url: 'https://computeprices.com',
  metadataBase: new URL('https://computeprices.com'),
  creator: 'Lansky Tech',
  twitterHandle: '@flowathletics',
  defaultDescription:
    'Compare cloud GPU specifications and pricing to find the most cost-effective option for your machine learning workloads',
} as const;

type GenerateMetadataOptions = {
  title: string;
  description?: string;
  path?: string;
  images?: string[];
};

type OpenGraphOptions = {
  title: string;
  description?: string;
  path?: string;
  images?: string[];
  type?: 'website' | 'article';
};

type TwitterOptions = {
  title: string;
  description?: string;
  images?: string[];
};

// Common metadata patterns
export const defaultMetadata: Metadata = {
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
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

// Helper function to generate metadata with canonical URL
export function generateMetadata({
  title,
  description = siteConfig.defaultDescription,
  path = '',
  images,
}: GenerateMetadataOptions): Metadata {
  const canonical = `${siteConfig.url}${path}`;

  return {
    ...defaultMetadata,
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: generateOpenGraph({ title, description, path, images }),
    twitter: generateTwitter({ title, description, images }),
  } satisfies Metadata;
}

// Helper function to generate OpenGraph metadata
export function generateOpenGraph({
  title,
  description = siteConfig.defaultDescription,
  path = '',
  images,
  type = 'website',
}: OpenGraphOptions): NonNullable<Metadata['openGraph']> {
  const imageList = images && images.length > 0 ? images : ['/og-image.png'];

  return {
    title,
    description,
    url: `${siteConfig.url}${path}`,
    siteName: siteConfig.name,
    images: imageList.map((img) => ({
      url: img,
      width: 1200,
      height: 630,
      alt: title,
    })),
    locale: 'en_US',
    type,
  };
}

// Helper function to generate Twitter metadata
export function generateTwitter({
  title,
  description = siteConfig.defaultDescription,
  images,
}: TwitterOptions): NonNullable<Metadata['twitter']> {
  const imageList = images && images.length > 0 ? images : ['/og-image.png'];

  return {
    card: 'summary_large_image',
    title,
    description,
    images: imageList,
    creator: siteConfig.twitterHandle,
  };
}

// Helper function to generate structured data for providers
export function generateProviderStructuredData(providers: Array<unknown>) {
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
        name: siteConfig.name,
      },
    },
  };
}
