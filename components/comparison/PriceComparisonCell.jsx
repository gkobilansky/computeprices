'use client';

import Image from 'next/image';

export default function PriceComparisonCell({ 
  provider1Data, 
  provider2Data, 
  comparisonMetrics,
  isHighlighted = false 
}) {
  const { price_difference, price_difference_percent, best_price } = comparisonMetrics;

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : 'N/A';
  };

  const formatPriceDifference = (difference, percent) => {
    if (difference === null || percent === null) return null;
    
    const sign = difference > 0 ? '+' : '';
    const color = difference > 0 ? 'text-red-600' : 'text-green-600';
    const arrow = difference > 0 ? '↑' : '↓';
    
    return {
      absolute: `${sign}${formatPrice(Math.abs(difference))}`,
      percentage: `${sign}${Math.abs(percent).toFixed(1)}%`,
      color,
      arrow
    };
  };

  const priceDiff = formatPriceDifference(price_difference, price_difference_percent);

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border ${
      isHighlighted ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
    }`}>
      {/* Provider 1 */}
      <div className={`p-4 rounded-lg ${
        best_price === 'provider1' ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border border-gray-200'
      }`}>
        {provider1Data ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Image 
                src={`/logos/${provider1Data.provider_slug}.png`} 
                alt={provider1Data.provider_name}
                width={16} 
                height={16} 
                className="rounded"
              />
              {provider1Data.provider_name}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(provider1Data.price_per_hour)}
              <span className="text-sm font-normal text-gray-500">/hour</span>
            </div>
            {provider1Data.gpu_count > 1 && (
              <div className="text-xs text-gray-500">
                {provider1Data.gpu_count}x GPU configuration
              </div>
            )}
            {provider1Data.created_at && (
              <div className="text-xs text-gray-400">
                Updated: {new Date(provider1Data.created_at).toLocaleDateString()}
              </div>
            )}
            {best_price === 'provider1' && (
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <span className="text-green-500">★</span>
                Best Price
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">
            <div className="text-sm">Not Available</div>
          </div>
        )}
      </div>

      {/* Provider 2 */}
      <div className={`p-4 rounded-lg ${
        best_price === 'provider2' ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border border-gray-200'
      }`}>
        {provider2Data ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Image 
                src={`/logos/${provider2Data.provider_slug}.png`} 
                alt={provider2Data.provider_name}
                width={16} 
                height={16} 
                className="rounded"
              />
              {provider2Data.provider_name}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(provider2Data.price_per_hour)}
              <span className="text-sm font-normal text-gray-500">/hour</span>
            </div>
            {provider2Data.gpu_count > 1 && (
              <div className="text-xs text-gray-500">
                {provider2Data.gpu_count}x GPU configuration
              </div>
            )}
            {provider2Data.created_at && (
              <div className="text-xs text-gray-400">
                Updated: {new Date(provider2Data.created_at).toLocaleDateString()}
              </div>
            )}
            {best_price === 'provider2' && (
              <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                <span className="text-green-500">★</span>
                Best Price
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-4">
            <div className="text-sm">Not Available</div>
          </div>
        )}
      </div>

      {/* Price Difference Indicator (only show when both prices exist) */}
      {priceDiff && provider1Data && provider2Data && (
        <div className="md:col-span-2 mt-2 pt-2 border-t border-gray-200">
          <div className="flex justify-center items-center gap-2 text-sm">
            <span className="text-gray-600">Price Difference:</span>
            <span className={`font-medium ${priceDiff.color} flex items-center gap-1`}>
              <span>{priceDiff.arrow}</span>
              <span>{priceDiff.absolute}</span>
              <span>({priceDiff.percentage})</span>
            </span>
          </div>
        </div>
      )}

      {/* Source Links */}
      <div className="md:col-span-2 flex justify-between items-center text-xs text-gray-500 mt-2">
        {provider1Data?.source_url && (
          <a 
            href={provider1Data.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            {provider1Data.source_name}
          </a>
        )}
        {provider2Data?.source_url && (
          <a 
            href={provider2Data.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-blue-600 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            {provider2Data.source_name}
          </a>
        )}
      </div>
    </div>
  );
}