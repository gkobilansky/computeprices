import Link from 'next/link';
import { Suspense } from 'react';
import GPUComparisonTable from '@/components/GPUComparisonTable';
import IntegratedFilters from '@/components/IntegratedFilters';
import GPUInfoCard from '@/components/GPUInfoCard';
import ProviderInfoCard from '@/components/ProviderInfoCard';
import FeedbackLauncher from '@/components/FeedbackLauncher';
import TopPicksSection from '@/components/TopPicksSection';
import HeroSection from '@/components/HeroSection';
import { getAllProviderSlugs } from '@/lib/utils/provider';
import { FilterProvider } from '@/lib/context/FilterContext';
import { generateMetadata } from './metadata';
import { getHomepageStats, getLatestPriceDrops } from '@/lib/utils/fetchGPUData';

const HOME_TITLE = 'Cloud GPU Price Comparison: Lambda, Runpod, Coreweave, AWS & More | ComputePrices.com';
const HOME_DESCRIPTION = 'Compare cloud GPU prices across 11+ providers. Find the cheapest H100, A100, and L40S rates for AI training and inference. Save up to 80% on cloud GPU costs.';

export const metadata = generateMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: '/'
});

export default async function Home() {
  const [providerSlugs, stats, priceAlert] = await Promise.all([
    getAllProviderSlugs(),
    getHomepageStats(),
    getLatestPriceDrops()
  ]);

  return (
    <>
      <FilterProvider>
        <div className="space-y-8">
          {/* Enhanced Hero Section */}
          <HeroSection stats={stats} />

          {/* Enhanced Superlatives Section */}
          <section className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-xl p-4 lg:p-5 mb-8" aria-label="Top GPU Picks">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-gray-900">
                <span className="text-xl">💡</span>
                <h2 className="text-xl font-semibold">Top Picks Right Now</h2>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white text-gray-800 shadow-sm border border-primary/10">
                Click a tile to filter the table
              </span>
            </div>
            <Suspense fallback={
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <TopPicksSection />
            </Suspense>
          </section>

          {/* Integrated Filters (replaces both quick search and provider filters) */}
          <Suspense fallback={
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          }>
            <IntegratedFilters />
          </Suspense>

          {/* Main Content */}
          <section id="gpu-table" aria-label="GPU Comparison Tools">
            <div className="grid grid-cols-12 gap-6">
              {/* Main Table Section */}
              <div className="col-span-12 lg:col-span-9">
                <GPUComparisonTable />
              </div>

              {/* Side Info Section */}
              <div className="col-span-12 lg:col-span-3 space-y-6 lg:sticky lg:top-8 self-start pt-14">
                <Suspense fallback={
                  <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
                }>
                  <ProviderInfoCard />
                </Suspense>
                <Suspense fallback={
                  <div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
                }>
                  <GPUInfoCard />
                </Suspense>
                <div className="flex justify-end">
                  <FeedbackLauncher />
                </div>
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
              "offerCount": stats.providerCount,
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
