'use client';

import Image from 'next/image';
import PriceComparisonCell from './PriceComparisonCell';

export default function DualProviderTableRow({ 
  comparisonData, 
  provider1, 
  provider2
}) {
  const {
    gpu_model_name,
    vram,
    manufacturer,
    provider1: provider1Data,
    provider2: provider2Data,
    price_difference,
    price_difference_percent,
    best_price,
    availability
  } = comparisonData;

  const comparisonMetrics = {
    price_difference,
    price_difference_percent,
    best_price
  };

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : 'N/A';
  };

  const getPriceDifferenceDisplay = () => {
    if (price_difference === null || price_difference_percent === null) return null;
    
    const sign = price_difference > 0 ? '+' : '';
    const color = price_difference > 0 ? 'text-red-600' : 'text-green-600';
    const arrow = price_difference > 0 ? '↑' : '↓';
    
    return (
      <span className={`text-xs ${color} flex items-center gap-1`}>
        <span>{arrow}</span>
        <span>{sign}${Math.abs(price_difference).toFixed(2)}</span>
        <span>({sign}{Math.abs(price_difference_percent).toFixed(1)}%)</span>
      </span>
    );
  };

  return (
    <>
      {/* Desktop Table Row */}
      <tr className="hidden md:table-row hover:bg-gray-50 border-t">
        {/* GPU Model Column */}
        <td className="px-6 py-4">
          <div className="flex flex-col">
            <div className="font-medium text-gray-900">{gpu_model_name}</div>
            <div className="text-sm text-gray-500">
              {vram}GB VRAM • {manufacturer}
            </div>
            <div className="flex gap-2 mt-1">
              {availability.provider1 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {provider1.name}
                </span>
              )}
              {availability.provider2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  {provider2.name}
                </span>
              )}
            </div>
          </div>
        </td>

        {/* Provider 1 Price */}
        <td className="px-6 py-4">
          {provider1Data ? (
            <div className={`p-3 rounded-lg ${
              best_price === 'provider1' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Image 
                  src={`/logos/${provider1Data.provider_slug}.png`} 
                  alt={provider1.name}
                  width={16} 
                  height={16} 
                  className="rounded"
                />
                <span className="text-sm font-medium">{formatPrice(provider1Data.price_per_hour)}/hr</span>
                {best_price === 'provider1' && (
                  <span className="text-green-500 text-xs">★ Best</span>
                )}
              </div>
              {provider1Data.gpu_count > 1 && (
                <div className="text-xs text-gray-500">
                  {provider1Data.gpu_count}x GPU
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm text-center py-2">
              Not Available
            </div>
          )}
        </td>

        {/* Provider 2 Price */}
        <td className="px-6 py-4">
          {provider2Data ? (
            <div className={`p-3 rounded-lg ${
              best_price === 'provider2' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Image 
                  src={`/logos/${provider2Data.provider_slug}.png`} 
                  alt={provider2.name}
                  width={16} 
                  height={16} 
                  className="rounded"
                />
                <span className="text-sm font-medium">{formatPrice(provider2Data.price_per_hour)}/hr</span>
                {best_price === 'provider2' && (
                  <span className="text-green-500 text-xs">★ Best</span>
                )}
              </div>
              {provider2Data.gpu_count > 1 && (
                <div className="text-xs text-gray-500">
                  {provider2Data.gpu_count}x GPU
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm text-center py-2">
              Not Available
            </div>
          )}
        </td>

        {/* Price Difference */}
        <td className="px-6 py-4 text-center">
          {getPriceDifferenceDisplay() || (
            <span className="text-gray-400 text-sm">—</span>
          )}
        </td>

        {/* Sources */}
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            {provider1Data?.source_url && (
              <a 
                href={provider1Data.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-600 text-xs flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002-2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                {provider1Data.source_name}
              </a>
            )}
            {provider2Data?.source_url && (
              <a 
                href={provider2Data.source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-600 text-xs flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002-2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                {provider2Data.source_name}
              </a>
            )}
          </div>
        </td>
      </tr>

      {/* Mobile Card (shown only on small screens) */}
      <tr className="md:hidden">
        <td colSpan={5} className="p-0">
          <div className="mx-3 my-4 rounded-lg border border-gray-100 bg-white shadow-sm">
            {/* GPU Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="font-medium text-gray-900 mb-1">{gpu_model_name}</div>
              <div className="text-sm text-gray-500">
                {vram}GB VRAM • {manufacturer}
              </div>
            </div>

            {/* Price Comparison */}
            <div className="p-4">
              <PriceComparisonCell
                provider1Data={provider1Data}
                provider2Data={provider2Data}
                comparisonMetrics={comparisonMetrics}
              />
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
