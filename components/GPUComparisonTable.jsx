'use client';

import { useTableSort } from '@/lib/hooks/useTableSort';
import { useGPUData } from '@/lib/hooks/useGPUData';
import { useMemo } from 'react';
import providers from '@/data/providers.json';

export default function GPUComparisonTable({ setSelectedGPU, setSelectedProvider, selectedGPU, selectedProvider }) {
  const { gpuData, loading, error } = useGPUData({ selectedProvider, selectedGPU });
  const { sortConfig, handleSort, getSortedData } = useTableSort('price_per_hour', 'asc');

  const handleRowClick = (gpu) => {
    setSelectedGPU({
      name: gpu.gpu_models.name,
      description: gpu.gpu_models.description,
      vram: `${gpu.gpu_models.vram}GB VRAM`,
      link: gpu.gpu_models.link,
    });

    const provider = providers.find(p => p.name === gpu.providers.name);
    setSelectedProvider(provider);
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
    return sortedData.filter(item => {
      if (selectedGPU && selectedProvider) {
        return item.gpu_models.id === selectedGPU.id && 
               item.providers.name === selectedProvider.name;
      }
      if (selectedGPU) {
        return item.gpu_models.id === selectedGPU.id;
      }
      if (selectedProvider) {
        return item.providers.name === selectedProvider.name;
      }
      return true;
    });
  }, [sortedData, selectedGPU, selectedProvider]);

  if (error) {
    return (
      <div className="text-center text-error">
        Error loading GPU data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="table comparison-table w-full md:table hidden">
          <thead>
            <tr className="bg-gray-50/50">
              <th key="provider-" onClick={() => handleSort(gpuData, 'provider')} 
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-50">
                Provider <SortIcon column="provider" />
              </th>
              <th key="gpu-model" onClick={() => handleSort(gpuData, 'gpu_model')} 
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-50">
                GPU Model <SortIcon column="gpu_model" />
              </th>
              <th key="vram" className="px-6 py-4 text-left cursor-pointer hover:bg-gray-50">
                VRAM
              </th>
              <th key="price-per-hour" onClick={() => handleSort(gpuData, 'price_per_hour')} 
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-50">
                Price/Hour
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
                <td className="px-6 py-4">{item.providers?.name}</td>
                <td className="px-6 py-4">{item.gpu_models?.name}</td>
                <td className="px-6 py-4">{item.gpu_models?.vram}</td>
                <td className="px-6 py-4">
                  <div className="tooltip" data-tip={`Last updated: ${new Date(item.price_created_at).toLocaleDateString()}`}>
                    <span className="font-medium">
                      ${item.price_per_hour?.toFixed(2)}
                    </span>
                    <span className="text-gray-500 text-sm">/hour</span>
                  </div>
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
                <strong>Provider:</strong> {item.providers?.name}
              </div>
              <div className="mb-2">
                <strong>GPU Model:</strong> {item.gpu_models?.name}
              </div>
              <div className="mb-2">
                <strong>VRAM:</strong> {item.gpu_models?.vram}
              </div>
              <div>
                <strong>Price/Hour:</strong> 
                <div className="tooltip" data-tip={`Last updated: ${new Date(item.price_created_at).toLocaleDateString()}`}>
                  <span className="font-medium">
                    ${item.price_per_hour?.toFixed(2)}
                  </span>
                  <span className="text-gray-500 text-sm">/hour</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}