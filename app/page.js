import Link from 'next/link';
import { Suspense } from 'react';
import GPUComparisonTable from '@/components/GPUComparisonTable';
import IntegratedFilters from '@/components/IntegratedFilters';
import GPUInfoCard from '@/components/GPUInfoCard';
import ProviderInfoCard from '@/components/ProviderInfoCard';
import Superlatives from '@/components/Superlatives';
import { getAllProviderSlugs } from '@/lib/utils/provider';
import { FilterProvider } from '@/lib/context/FilterContext';
import { generateMetadata } from './metadata';
import { getHomepageStats, getLatestPriceDrops } from '@/lib/utils/fetchGPUData';

const HOME_TITLE = 'Cloud GPU Price Comparison: Lambda, Coreweave, AWS & More | ComputePrices.com';
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
          <section className="max-w-4xl">
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              <span className="gradient-text-1">Save on GPU Costs</span>
              <span className="block text-3xl mt-2 text-gray-700 font-medium">
                Compare {stats.gpuCount} GPUs across {stats.providerCount} providers instantly
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Find the cheapest{' '}
              <Link href="/gpus/h100" className="text-primary hover:underline underline-offset-2 decoration-1 decoration-dotted">
                H100
              </Link>,{' '}
              <Link href="/gpus/a100-pcie" className="text-primary hover:underline underline-offset-2 decoration-1 decoration-dotted">
                A100
              </Link>, and{' '}
              <Link href="/gpus/rtx-4090" className="text-primary hover:underline underline-offset-2 decoration-1 decoration-dotted">
                RTX 4090
              </Link>{' '}
              rates in seconds.
              <strong className="text-gray-800 ml-1">Daily pricing from Lambda, CoreWeave, AWS & <Link href="/providers" className="text-primary hover:underline underline-offset-2 decoration-1 decoration-dotted">more</Link>.</strong>
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Updated daily
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {stats.providerCount} providers monitored
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {stats.pricePointsChecked}+ price points checked
              </div>
              <div className="flex items-center gap-2">
                <Link href="/gpus" className="text-primary gradient-text-1 hover:underline font-medium">
                  Need help choosing? →
                </Link>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">$2.3M+</div>
                <div className="text-sm text-gray-600">Saved by users</div>
              </div>
              <div className="text-center bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{stats.providerCount}+</div>
                <div className="text-sm text-gray-600">Providers</div>
              </div>
              <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-gray-600">Price monitoring</div>
              </div>
              <div className="text-center bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">80%</div>
                <div className="text-sm text-gray-600">Max savings</div>
              </div>
            </div>
          </section>

          {/* Real Price Alert Banner */}
          {priceAlert.hasAlert && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    <strong>💥 Price Alert:</strong> {priceAlert.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Superlatives Section */}
          <section className="bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 rounded-xl p-6 mb-8" aria-label="Top GPU Picks">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              💡 <span className="gradient-text-1">Top Picks Right Now</span>
            </h2>
            <Suspense fallback={
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }>
              <Superlatives />
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
          <section aria-label="GPU Comparison Tools">
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
