'use client';

import { useTableSort } from '@/lib/hooks/useTableSort';
import { useGPUData } from '@/lib/hooks/useGPUData';
import { useMemo } from 'react';
import GPUGuide from './GPUGuide';
import providers from '@/data/providers.json';

export default function GPUComparisonTable({ setSelectedGPU, setSelectedProvider }) {
  const { gpuData, loading, error } = useGPUData();
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

  if (error) {
    return (
      <div className="text-center text-error">
        Error loading GPU data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="overflow-x-auto rounded-lg border">
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => handleSort(gpuData, 'provider')} className="cursor-pointer hover:bg-base-200">
                Provider <SortIcon column="provider" />
              </th>
              <th onClick={() => handleSort(gpuData, 'gpu_model')} className="cursor-pointer hover:bg-base-200">
                GPU Model <SortIcon column="gpu_model" />
              </th>
              <th onClick={() => handleSort(gpuData, 'price_per_hour')} className="cursor-pointer hover:bg-base-200">
                Price/Hour <SortIcon column="price_per_hour" />
              </th>
              <th onClick={() => handleSort(gpuData, 'vram')} className="cursor-pointer hover:bg-base-200">
                VRAM (GB) <SortIcon column="vram" />
              </th>
              <th onClick={() => handleSort(gpuData, 'regions')} className="cursor-pointer hover:bg-base-200">
                Regions <SortIcon column="regions" />
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center">Loading...</td>
              </tr>
            ) : sortedData.map((item) => (
              <tr key={item.id} className="group relative cursor-pointer" onClick={() => handleRowClick(item)}>
                <td>{item.providers.name}</td>
                <td className="relative">
                  {item.gpu_models.name}
                </td>
                <td>${item.price_per_hour?.toFixed(2)}</td>
                <td>{item.gpu_models?.vram}</td>
                <td>{item.regions?.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <GPUGuide />
    </div>
  );
}