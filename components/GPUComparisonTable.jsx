'use client';

import { useTableSort } from '@/lib/hooks/useTableSort';
import { useGPUData } from '@/lib/hooks/useGPUData';
import { useMemo } from 'react';
import providers from '@/data/providers.json';

export default function GPUComparisonTable({ setSelectedGPU, setSelectedProvider, selectedGPU, selectedProvider }) {
  const { gpuData, loading, error } = useGPUData({ selectedProvider });
  const { sortConfig, handleSort, getSortedData } = useTableSort('price_per_hour', 'asc');

  const handleRowClick = (gpu) => {
    setSelectedGPU({
      name: gpu.gpu_models.name,
      description: "Description for " + gpu.gpu_models.name, // Add actual descriptions here
      vram: `${gpu.gpu_models.vram}GB VRAM`,
      cudaCores: `${gpu.gpu_models.cuda_cores?.toLocaleString()} CUDA cores`,
      usage: "Usage info", // Add actual usage info here
      cost: `$${gpu.price_per_hour.toFixed(2)}/hour`,
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
      if (selectedGPU) {
        return item.gpu_models.id === selectedGPU;
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
        <table className="table comparison-table w-full">
          <thead>
            <tr className="bg-gray-50/50">
              <th onClick={() => handleSort(gpuData, 'provider')} 
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-50">
                Provider <SortIcon column="provider" />
              </th>
              <th onClick={() => handleSort(gpuData, 'gpu_model')} 
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-50">
                GPU Model <SortIcon column="gpu_model" />
              </th>
              <th onClick={() => handleSort(gpuData, 'price_per_hour')} 
                  className="px-6 py-4 text-left cursor-pointer hover:bg-gray-50">
                Price/Hour <SortIcon column="price_per_hour" />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
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
      </div>
    </div>
  );
}