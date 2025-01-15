import Link from 'next/link';
import { Suspense } from 'react';
import GPUComparisonTable from '@/components/GPUComparisonTable';
import ProviderFilters from '@/components/ProviderFilters';
import GPUInfoCard from '@/components/GPUInfoCard';
import ProviderInfoCard from '@/components/ProviderInfoCard';
import Superlatives from '@/components/Superlatives';
import { getAllProviderSlugs } from '@/lib/utils/provider';
import { FilterProvider } from '@/lib/context/FilterContext';
import { generateOpenGraph, generateProviderStructuredData } from './metadata';

const HOME_TITLE = 'Cloud GPU Price Comparison | Find the Best ML/AI GPU Deals';
const HOME_DESCRIPTION = 'Compare cloud GPU prices across major providers like AWS, Google Cloud, and Azure. Find the most cost-effective GPUs for machine learning and AI workloads.';

export const metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: 'https://computeprices.com'
  },
  openGraph: generateOpenGraph({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: '/'
  })
};

export default async function Home() {
  const providerSlugs = await getAllProviderSlugs();

  return (
    <>
      <FilterProvider>
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">
              Find the Best
              <span className="gradient-text-1 block mt-1">Cloud GPU Pricing</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Compare the most cost-effective GPUs for your machine learning workloads.
              <Link href="/gpus" className="text-primary gradient-text-1 hover:underline ml-1">
                Need help choosing?
              </Link>
            </p>
          </section>

          {/* Main Content */}
          <section className="space-y-6" aria-label="GPU Comparison Tools">
            <Suspense fallback={<div>Loading top picks...</div>}>
              <Superlatives />
            </Suspense>
            
            <Suspense fallback={<div>Loading filters...</div>}>
              <ProviderFilters />
            </Suspense>
            
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 order-2 lg:order-1">
                <Suspense fallback={<div>Loading comparison table...</div>}>
                  <GPUComparisonTable />
                </Suspense>
              </div>
              <div className="lg:w-80 space-y-6 order-1 lg:order-2">
                <Suspense fallback={<div>Loading provider info...</div>}>
                  <ProviderInfoCard />
                </Suspense>
                <Suspense fallback={<div>Loading GPU info...</div>}>
                  <GPUInfoCard />
                </Suspense>
              </div>
            </div>
          </section>
        </div>
      </FilterProvider>

      {/* WebSite Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Compute Prices",
            "url": "https://computeprices.com",
            "description": "Compare cloud GPU prices and specifications for machine learning and AI workloads",
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://computeprices.com/gpus?search={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />

      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Compute Prices",
            "url": "https://computeprices.com",
            "logo": "https://computeprices.com/cp-logo.svg",
            "sameAs": [
              "https://twitter.com/flowathletics"
            ],
            "knowsAbout": [
              "Cloud Computing",
              "GPU Computing",
              "Machine Learning",
              "Artificial Intelligence",
              "Cloud GPU Pricing"
            ]
          })
        }}
      />

      {/* SoftwareApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "GPU Price Comparison Tool",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "AggregateOffer",
              "offerCount": providerSlugs.length,
              "availableDeliveryMethod": "http://schema.org/OnlineDelivery",
              "category": "Cloud GPU Services",
              "seller": {
                "@type": "Organization",
                "name": "Compute Prices"
              }
            }
          })
        }}
      />
    </>
  );
}
