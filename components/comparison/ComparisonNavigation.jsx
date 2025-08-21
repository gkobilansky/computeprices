'use client';

import Link from 'next/link';

// Custom SVG Icons
const ChevronRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const HomeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ScaleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

export default function ComparisonNavigation({ 
  provider1, 
  provider2, 
  className = "" 
}) {
  // Generate popular comparison suggestions (excluding current comparison)
  const popularComparisons = [
    { provider1: "aws", provider2: "coreweave", label: "AWS vs CoreWeave" },
    { provider1: "aws", provider2: "runpod", label: "AWS vs RunPod" },
    { provider1: "coreweave", provider2: "lambda", label: "CoreWeave vs Lambda" },
    { provider1: "google", provider2: "azure", label: "Google vs Azure" },
    { provider1: "hyperstack", provider2: "fluidstack", label: "Hyperstack vs FluidStack" },
    { provider1: "vast", provider2: "runpod", label: "Vast.ai vs RunPod" }
  ].filter(comp => 
    !(
      (comp.provider1 === provider1?.slug && comp.provider2 === provider2?.slug) ||
      (comp.provider1 === provider2?.slug && comp.provider2 === provider1?.slug)
    )
  ).slice(0, 4);

  // Generate related comparisons (one provider in common)
  const relatedComparisons = [
    { provider1: provider1?.slug, provider2: "coreweave", label: `${provider1?.name} vs CoreWeave` },
    { provider1: provider1?.slug, provider2: "runpod", label: `${provider1?.name} vs RunPod` },
    { provider1: provider2?.slug, provider2: "lambda", label: `${provider2?.name} vs Lambda` },
    { provider1: provider2?.slug, provider2: "aws", label: `${provider2?.name} vs AWS` }
  ].filter(comp => 
    comp.provider1 !== provider2?.slug && 
    comp.provider2 !== provider1?.slug &&
    comp.provider1 && comp.provider2
  ).slice(0, 3);

  return (
    <nav className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <Link 
            href="/" 
            className="flex items-center hover:text-gray-900 transition-colors"
          >
            <HomeIcon className="w-4 h-4 mr-1" />
            Home
          </Link>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <Link 
            href="/compare" 
            className="hover:text-gray-900 transition-colors"
          >
            Compare
          </Link>
          <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-medium">
            {provider1?.name} vs {provider2?.name}
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Quick Actions */}
          <div className="flex items-center space-x-4">
            <Link
              href="/providers"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <ScaleIcon className="w-4 h-4 mr-2" />
              All Providers
            </Link>
            
            <Link
              href={`/providers/${provider1?.slug}`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {provider1?.name} Details
            </Link>
            
            <Link
              href={`/providers/${provider2?.slug}`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              {provider2?.name} Details
            </Link>
          </div>

          {/* Popular Comparisons */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Popular:</span>
            <div className="flex flex-wrap gap-2">
              {popularComparisons.map((comp, index) => (
                <Link
                  key={index}
                  href={`/compare/${comp.provider1}-vs-${comp.provider2}`}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {comp.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Related Comparisons */}
        {relatedComparisons.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Related Comparisons:</span>
              <div className="flex flex-wrap gap-2">
                {relatedComparisons.map((comp, index) => (
                  <Link
                    key={index}
                    href={`/compare/${comp.provider1}-vs-${comp.provider2}`}
                    className="text-xs px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    {comp.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}