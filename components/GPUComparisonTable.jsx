'use client';

import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead 
} from '@/components/ui/table';
import { useTableSort } from '@/lib/hooks/useTableSort';
import { useGPUData } from '@/lib/hooks/useGPUData';
import { useMemo } from 'react';

export default function GPUComparisonTable() {
  const { gpuData, loading, error } = useGPUData();
  const { sortConfig, handleSort, getSortedData } = useTableSort('price_per_hour', 'asc');

  const SortIcon = ({ column }) => {
    const isActive = sortConfig.key === column;
    return (
      <span className={`ml-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
        {isActive ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
  };

  const sortedData = useMemo(() => {
    return getSortedData(gpuData);
  }, [gpuData, getSortedData]);

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading GPU data. Please try again later.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              onClick={() => handleSort(gpuData, 'provider')}
              className="cursor-pointer hover:bg-gray-100"
            >
              Provider <SortIcon column="provider" />
            </TableHead>
            <TableHead 
              onClick={() => handleSort(gpuData, 'gpu_model')}
              className="cursor-pointer hover:bg-gray-100"
            >
              GPU Model <SortIcon column="gpu_model" />
            </TableHead>
            <TableHead 
              onClick={() => handleSort(gpuData, 'price_per_hour')}
              className="cursor-pointer hover:bg-gray-100"
            >
              Price/Hour <SortIcon column="price_per_hour" />
            </TableHead>
            <TableHead 
              onClick={() => handleSort(gpuData, 'vram')}
              className="cursor-pointer hover:bg-gray-100"
            >
              VRAM (GB) <SortIcon column="vram" />
            </TableHead>
            <TableHead 
              onClick={() => handleSort(gpuData, 'regions')}
              className="cursor-pointer hover:bg-gray-100"
            >
              Regions <SortIcon column="regions" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Loading...</TableCell>
            </TableRow>
          ) : sortedData.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.providers.name}</TableCell>
              <TableCell>{item.gpu_models.name}</TableCell>
              <TableCell>${item.price_per_hour.toFixed(2)}</TableCell>
              <TableCell>{item.gpu_models.vram}</TableCell>
              <TableCell>{item.regions.join(', ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}