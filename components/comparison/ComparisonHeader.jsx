'use client';

import Link from 'next/link';

// Custom SVG Icons
const ArrowRightIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const GlobeAltIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const CpuChipIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
);

const CurrencyDollarIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

export default function ComparisonHeader({ 
  provider1, 
  provider2, 
  comparisonData,
  metadata
}) {
  // Ensure defaults are properly typed
  const data = comparisonData || [];
  const meta = metadata || {};
  const totalGPUs = meta.totalGPUs || data.length;
  const provider1Available = meta.provider1Available || 0;
  const provider2Available = meta.provider2Available || 0;
  const bothAvailable = meta.bothAvailable || 0;

  // Calculate basic comparison stats
  const avgPriceDiff = data
    .filter(item => item.price_difference !== null)
    .reduce((acc, item, _, arr) => acc + Math.abs(item.price_difference) / arr.length, 0);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-8">
        {/* Main Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {provider1?.name} vs {provider2?.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
            Compare GPU pricing, features, and specifications between {provider1?.name} and {provider2?.name} cloud providers. 
            Find the best deals for AI training, inference, and ML workloads.
          </p>
        </div>

        {/* Provider Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Provider 1 Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {provider1?.name?.charAt(0) || 'P'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {provider1?.name}
                  </h2>
                  <p className="text-blue-700 font-medium">Provider 1</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {provider1Available}
                </div>
                <div className="text-sm text-blue-700">GPUs Available</div>
              </div>
            </div>
            
            {provider1?.link && (
              <Link
                href={provider1.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <GlobeAltIcon className="w-4 h-4 mr-2" />
                Visit Website
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>

          {/* Provider 2 Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {provider2?.name?.charAt(0) || 'P'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {provider2?.name}
                  </h2>
                  <p className="text-green-700 font-medium">Provider 2</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {provider2Available}
                </div>
                <div className="text-sm text-green-700">GPUs Available</div>
              </div>
            </div>
            
            {provider2?.link && (
              <Link
                href={provider2.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
              >
                <GlobeAltIcon className="w-4 h-4 mr-2" />
                Visit Website
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>
        </div>

        {/* Comparison Stats */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Comparison Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CpuChipIcon className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalGPUs}</div>
              <div className="text-sm text-gray-600">Total GPU Models</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {provider1?.name?.charAt(0) || 'P1'}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{provider1Available}</div>
              <div className="text-sm text-gray-600">{provider1?.name} GPUs</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {provider2?.name?.charAt(0) || 'P2'}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">{provider2Available}</div>
              <div className="text-sm text-gray-600">{provider2?.name} GPUs</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CurrencyDollarIcon className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{bothAvailable}</div>
              <div className="text-sm text-gray-600">Direct Comparisons</div>
            </div>
          </div>
          
          {avgPriceDiff > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-sm text-yellow-800">
                <strong>Average Price Difference:</strong> ${avgPriceDiff.toFixed(2)}/hour between comparable GPUs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}