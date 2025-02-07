'use client';

import { useTableSort } from '@/lib/hooks/useTableSort';
import { useGPUData } from '@/lib/hooks/useGPUData';
import { useFilter } from '@/lib/context/FilterContext';
import { useMemo, useState } from 'react';

export default function GPUComparisonTable() {
  const [showBestPriceOnly, setShowBestPriceOnly] = useState(false);
  const { selectedGPU, setSelectedGPU, selectedProvider, setSelectedProvider } = useFilter();
  const { gpuData, loading, error } = useGPUData();
  const { sortConfig, handleSort, getSortedData } = useTableSort('price_per_hour', 'asc');

  const handleRowClick = (row) => {
    setSelectedGPU({
      name: row.gpu_model_name,
      id: row.gpu_model_id
    });

    setSelectedProvider({
      name: row.provider_name,
      id: row.provider_id
    });
  };

  const SortIcon = ({ column }) => {
    const isActive = sortConfig.key === column;
    return (
      <span className={`ml-1 ${isActive ? 'text-primary' : 'text-base-content/60'}`}>
        {isActive ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
  };

  const sortedData = useMemo(() => {
    return getSortedData(gpuData);
  }, [gpuData, getSortedData]);

  const filteredData = useMemo(() => {
    let data = sortedData;    
    // First filter by selected GPU/provider
    data = data.filter(item => {
      if (selectedGPU && selectedProvider) {
        return item.gpu_model_id === selectedGPU.id && 
               item.provider_name === selectedProvider.name;
      }
      if (selectedGPU) {
        return item.gpu_model_id === selectedGPU.id;
      }
      if (selectedProvider) {
        return item.provider_name === selectedProvider.name;
      }
      return true;
    });

    // Then filter for best prices if enabled
    if (showBestPriceOnly) {
      const bestPrices = new Map();
      data.forEach(item => {
        const existing = bestPrices.get(item.gpu_model_id);
        if (!existing || item.price_per_hour < existing.price_per_hour) {
          bestPrices.set(item.gpu_model_id, item);
        }
      });
      data = Array.from(bestPrices.values());
    }

    return data;
  }, [sortedData, selectedGPU, selectedProvider, showBestPriceOnly]);

  if (error) {
    return (
      <div className="text-center text-error">
        Error loading GPU data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-8">
     <label className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-sm">Show Best Prices Only</span>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={showBestPriceOnly}
          onChange={(e) => setShowBestPriceOnly(e.target.checked)}
        />
      </label>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="table comparison-table w-full md:table hidden">
          <thead>
            <tr className="bg-gray-50/50">
              <th key="provider-name" onClick={() => handleSort(gpuData, 'provider_name')} 
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-50">
                Provider <SortIcon column="provider_name" />
              </th>
              <th key="gpu-model" onClick={() => handleSort(gpuData, 'gpu_model_name')} 
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-50">
                GPU Model <SortIcon column="gpu_model_name" />
              </th>
              <th key="price-per-hour" onClick={() => handleSort(gpuData, 'price_per_hour')} 
                  className="px-6 py-4 w-30 text-left cursor-pointer hover:bg-gray-50">
                Price/Hour <SortIcon column="price_per_hour" />
              </th>
              <th className="px-6 py-4 w-10">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr key="loading">
                <td colSpan={5} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : filteredData.map((item) => (
              <tr key={item.id} 
                  onClick={() => handleRowClick(item)}
                  className="hover-card-shadow cursor-pointer border-t">
                <td className="px-6 py-4">{item.provider_name}</td>
                <td className="px-6 py-4">{item.gpu_model_name}</td>
                <td className="px-6 py-4">
                  <div className="tooltip" data-tip={`Last updated: ${new Date(item.created_at).toLocaleDateString()}`}>
                    <span className="font-medium">
                      ${item.price_per_hour?.toFixed(2)}
                    </span>
                    <span className="text-gray-500 text-sm">/hour</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.source_url && (
                    <div className="tooltip" data-tip={item.source_name}>
                      <a href={item.source_url} target="_blank" rel="noopener noreferrer" 
                         onClick={(e) => e.stopPropagation()} 
                         className="text-gray-500 hover:text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                      </a>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="block md:hidden">
          {loading ? (
            <div className="px-6 py-8 text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span>Loading...</span>
              </div>
            </div>
          ) : filteredData.map((item) => (
            <div key={item.id} 
                 onClick={() => handleRowClick(item)}
                 className="hover-card-shadow cursor-pointer border-t p-4 mb-4 rounded-lg shadow-md">
              <div className="mb-2">
                <strong>Provider:</strong> {item.provider_name}
              </div>
              <div className="mb-2">
                <strong>GPU Model:</strong> {item.gpu_model_name}
              </div>
              <div className="mb-2">
                <strong>VRAM:</strong> {item.gpu_model_vram}GB
              </div>
              <div>
                <strong>Price/Hour:</strong> 
                <div className="tooltip" data-tip={`Last updated: ${new Date(item.created_at).toLocaleDateString()}`}>
                  <span className="font-medium">
                    ${item.gpu_count ? (item.price_per_hour / item.gpu_count).toFixed(2) : item.price_per_hour?.toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-sm">/hour</span>
                </div>
              </div>
              {item.source_url && (
                <div className="mt-2">
                  <strong>Source:</strong>
                  <a href={item.source_url} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     onClick={(e) => e.stopPropagation()}
                     className="ml-2 text-primary hover:text-primary-focus">
                    {item.source_name}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}