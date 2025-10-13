'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTableSort } from '@/lib/hooks/useTableSort';
import { fetchProviderComparison } from '@/lib/utils/fetchGPUData';
import DualProviderTableRow from './DualProviderTableRow';
import ComparisonTableFilters from './ComparisonTableFilters';

const DISPLAY_LIMIT = 15;

export default function ComparisonPricingTable({ 
  provider1Id, 
  provider2Id,
  provider1Name,
  provider2Name,
  initialData = null,
}) {
  const [comparisonData, setComparisonData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [selectedGPU, setSelectedGPU] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Comparison-specific filters
  const [showBothAvailable, setShowBothAvailable] = useState(false);
  const [showBestPricesOnly, setShowBestPricesOnly] = useState(false);
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');

  const { sortConfig, handleSort, getSortedData } = useTableSort('gpu_model_name', 'asc');

  // Fetch comparison data
  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      if (!provider1Id || !provider2Id) return;
      if (initialData) {
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await fetchProviderComparison(provider1Id, provider2Id);
        if (isSubscribed) {
          setComparisonData(data);
        }
      } catch (err) {
        if (isSubscribed) {
          console.error('Error fetching comparison data:', err);
          setError(err.message || 'Failed to load comparison data');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, [provider1Id, provider2Id, initialData]);

  useEffect(() => {
    if (initialData) {
      setComparisonData(initialData);
      setLoading(false);
      setError(null);
    }
  }, [initialData]);

  // Sort and filter data
  const processedData = useMemo(() => {
    if (!comparisonData?.comparisonData) return [];

    let data = [...comparisonData.comparisonData];

    // Apply filters
    if (showBothAvailable) {
      data = data.filter(item => item.availability.provider1 && item.availability.provider2);
    }

    if (showBestPricesOnly && !showBothAvailable) {
      // Show only items where this provider has the best price
      data = data.filter(item => item.best_price !== null);
    }

    if (manufacturerFilter !== 'all') {
      data = data.filter(item => 
        item.manufacturer?.toLowerCase() === manufacturerFilter.toLowerCase()
      );
    }

    if (priceRangeFilter !== 'all') {
      data = data.filter(item => {
        // Get the lower price from both providers for filtering
        const prices = [
          item.provider1?.price_per_hour,
          item.provider2?.price_per_hour
        ].filter(Boolean);
        
        if (prices.length === 0) return false;
        
        const minPrice = Math.min(...prices);
        
        switch (priceRangeFilter) {
          case 'under-1':
            return minPrice < 1;
          case '1-5':
            return minPrice >= 1 && minPrice <= 5;
          case '5-20':
            return minPrice >= 5 && minPrice <= 20;
          case '20-plus':
            return minPrice >= 20;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    return getSortedData(data);
  }, [comparisonData, showBothAvailable, showBestPricesOnly, priceRangeFilter, manufacturerFilter, getSortedData]);

  const visibleData = useMemo(() => {
    return isExpanded ? processedData : processedData.slice(0, DISPLAY_LIMIT);
  }, [processedData, isExpanded]);

  const SortIcon = ({ column }) => {
    const isActive = sortConfig.key === column;
    return (
      <span className={`ml-1 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
        {isActive ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading comparison data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">Error Loading Data</div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!comparisonData?.comparisonData || comparisonData.comparisonData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-600">
          No GPU pricing data available for comparison between {provider1Name} and {provider2Name}.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header with Summary Stats */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              GPU Pricing Comparison
            </h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Total GPUs: {comparisonData.metadata.totalGPUs}</span>
              <span>Both Available: {comparisonData.metadata.bothAvailable}</span>
              <span>{provider1Name}: {comparisonData.metadata.provider1Available}</span>
              <span>{provider2Name}: {comparisonData.metadata.provider2Available}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date(comparisonData.metadata.fetchedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <ComparisonTableFilters
        showBothAvailable={showBothAvailable}
        setShowBothAvailable={setShowBothAvailable}
        showBestPricesOnly={showBestPricesOnly}
        setShowBestPricesOnly={setShowBestPricesOnly}
        priceRangeFilter={priceRangeFilter}
        setPriceRangeFilter={setPriceRangeFilter}
        manufacturerFilter={manufacturerFilter}
        setManufacturerFilter={setManufacturerFilter}
        totalResults={processedData.length}
        provider1Name={provider1Name}
        provider2Name={provider2Name}
      />

      {/* Results Summary */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {visibleData.length} of {processedData.length} GPUs
          </span>
          {processedData.length === 0 && (
            <span className="text-amber-600">
              No results match your current filters
            </span>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th 
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort(comparisonData?.comparisonData ?? [], 'gpu_model_name')}
              >
                GPU Model <SortIcon column="gpu_model_name" />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                {provider1Name} Price
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                {provider2Name} Price
              </th>
              <th 
                className="px-6 py-4 text-center text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort(comparisonData?.comparisonData ?? [], 'price_difference')}
              >
                Price Diff <SortIcon column="price_difference" />
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                Sources
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleData.map((item) => (
              <DualProviderTableRow
                key={`${item.gpu_model_id}`}
                comparisonData={item}
                provider1={comparisonData.provider1}
                provider2={comparisonData.provider2}
                isSelected={selectedGPU?.id === item.gpu_model_id}
                onClick={(data) => setSelectedGPU({ 
                  id: data.gpu_model_id, 
                  name: data.gpu_model_name 
                })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards - DualProviderTableRow handles mobile layout */}
      <div className="md:hidden">
        <table className="w-full">
          <tbody>
            {visibleData.map((item) => (
              <DualProviderTableRow
                key={`mobile-${item.gpu_model_id}`}
                comparisonData={item}
                provider1={comparisonData.provider1}
                provider2={comparisonData.provider2}
                isSelected={selectedGPU?.id === item.gpu_model_id}
                onClick={(data) => setSelectedGPU({ 
                  id: data.gpu_model_id, 
                  name: data.gpu_model_name 
                })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Show More/Less Button */}
      {processedData.length > DISPLAY_LIMIT && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isExpanded ? 'Show Less' : `Show All ${processedData.length} GPUs`}
          </button>
        </div>
      )}
    </div>
  );
}
