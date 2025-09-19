'use client';

import { useState } from 'react';

export default function ComparisonTableFilters({
  showBothAvailable,
  setShowBothAvailable,
  showBestPricesOnly,
  setShowBestPricesOnly,
  priceRangeFilter,
  setPriceRangeFilter,
  manufacturerFilter,
  setManufacturerFilter,
  totalResults,
  provider1Name,
  provider2Name
}) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const clearAllFilters = () => {
    setShowBothAvailable(false);
    setShowBestPricesOnly(false);
    setPriceRangeFilter('all');
    setManufacturerFilter('all');
  };

  const hasActiveFilters = showBothAvailable || showBestPricesOnly || priceRangeFilter !== 'all' || manufacturerFilter !== 'all';

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* Filter Toggle Button */}
      <div className="px-6 py-3">
        <button
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isFiltersExpanded ? 'rotate-90' : ''}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span>Comparison Filters</span>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              {[showBothAvailable, showBestPricesOnly, priceRangeFilter !== 'all', manufacturerFilter !== 'all'].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Controls */}
      {isFiltersExpanded && (
        <div className="px-6 pb-4 space-y-4">
          {/* Quick Filter Toggles */}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBothAvailable}
                onChange={(e) => setShowBothAvailable(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Both providers available</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBestPricesOnly}
                onChange={(e) => setShowBestPricesOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show best prices only</span>
            </label>
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range
              </label>
              <select
                value={priceRangeFilter}
                onChange={(e) => setPriceRangeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Prices</option>
                <option value="under-1">Under $1/hour</option>
                <option value="1-5">$1 - $5/hour</option>
                <option value="5-20">$5 - $20/hour</option>
                <option value="20-plus">$20+/hour</option>
              </select>
            </div>

            {/* Manufacturer Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer
              </label>
              <select
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Manufacturers</option>
                <option value="nvidia">NVIDIA</option>
                <option value="amd">AMD</option>
                <option value="intel">Intel</option>
              </select>
            </div>

            {/* Results Summary and Clear */}
            <div className="flex flex-col justify-end">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600">
                  {totalResults} results
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Descriptions */}
          <div className="text-xs text-gray-500 space-y-1">
            {showBothAvailable && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Showing only GPUs available from both {provider1Name} and {provider2Name}</span>
              </div>
            )}
            {showBestPricesOnly && !showBothAvailable && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Showing only GPUs where one provider has a clear best price</span>
              </div>
            )}
            {priceRangeFilter !== 'all' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>
                  Filtered by price range: {
                    priceRangeFilter === 'under-1' ? 'Under $1/hour' :
                    priceRangeFilter === '1-5' ? '$1 - $5/hour' :
                    priceRangeFilter === '5-20' ? '$5 - $20/hour' :
                    priceRangeFilter === '20-plus' ? '$20+/hour' : ''
                  }
                </span>
              </div>
            )}
            {manufacturerFilter !== 'all' && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>Filtered by manufacturer: {manufacturerFilter.toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Filter Tips */}
          <div className="text-xs text-gray-400 bg-gray-100 p-3 rounded-lg">
            <div className="font-medium mb-1">💡 Filter Tips:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use &ldquo;Both providers available&rdquo; to compare direct alternatives</li>
              <li>Enable &ldquo;Best prices only&rdquo; to focus on cost-effective options</li>
              <li>Combine filters to narrow down to specific use cases</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
