'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTableSort } from '@/lib/hooks/useTableSort';
import { fetchProviderComparison } from '@/lib/utils/fetchGPUData';
import DualProviderTableRow from './DualProviderTableRow';

const DISPLAY_LIMIT = 15;

/**
 * @typedef {Awaited<ReturnType<typeof fetchProviderComparison>> | null} ComparisonPayload
 *
 * @typedef {Object} ComparisonPricingTableProps
 * @property {string} provider1Id
 * @property {string} provider2Id
 * @property {string} provider1Name
 * @property {string} provider2Name
 * @property {ComparisonPayload} [initialData]
 */

/**
 * @param {ComparisonPricingTableProps} props
 */
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
  const [isExpanded, setIsExpanded] = useState(false);

  const { sortConfig, handleSort, getSortedData } = useTableSort('gpu_model_name', 'asc');

  // Fetch comparison data
  useEffect(() => {
    let isSubscribed = true;

    const hydrateFromInitialData = () => {
      setComparisonData(initialData);
      setLoading(false);
      setError(null);
    };

    const fetchData = async () => {
      if (!provider1Id || !provider2Id) return;

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

    if (initialData) {
      hydrateFromInitialData();
      return () => {
        isSubscribed = false;
      };
    }

    fetchData();

    return () => {
      isSubscribed = false;
    };
  }, [provider1Id, provider2Id, initialData]);

  // Sort and filter data
  const processedData = useMemo(() => {
    if (!comparisonData?.comparisonData) return [];

    return getSortedData(comparisonData.comparisonData);
  }, [comparisonData, getSortedData]);

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
      {/* Lightweight summary bar */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm text-gray-700">
        <div className="flex flex-wrap gap-4">
          <span>Total GPUs: {comparisonData.metadata.totalGPUs}</span>
          <span>Both available: {comparisonData.metadata.bothAvailable}</span>
          <span>{provider1Name}: {comparisonData.metadata.provider1Available}</span>
          <span>{provider2Name}: {comparisonData.metadata.provider2Available}</span>
        </div>
        <div className="text-sm text-gray-600">
          Showing {visibleData.length} of {processedData.length} GPUs
        </div>
        <div className="text-xs text-gray-500">
          Last updated: {new Date(comparisonData.metadata.fetchedAt).toLocaleString()}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th 
                className="px-6 py-4 text-left text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('gpu_model_name')}
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
                onClick={() => handleSort('price_difference')}
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
