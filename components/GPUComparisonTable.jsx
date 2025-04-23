import { fetchGPUPrices } from '@/lib/utils/fetchGPUData';
import GPUComparisonTableClient from './GPUComparisonTableClient';

export default async function GPUComparisonTable() {
  // Fetch initial data on the server
  const { data: initialData } = await fetchGPUPrices({ selectedProvider: null, selectedGPU: null });

  return <GPUComparisonTableClient initialData={initialData} />;
}