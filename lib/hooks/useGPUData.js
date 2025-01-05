import { useState, useEffect } from 'react';
import { fetchGPUPrices } from '@/lib/utils/fetchGPUData';

export function useGPUData({ selectedProvider, selectedGPU }) {
  const [gpuData, setGpuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedProvider, selectedGPU]);

  async function fetchData() {
    console.log('fetchData called with selectedProvider:', selectedProvider);
    console.log('fetchData called with selectedGPU:', selectedGPU);
    try {
      setLoading(true);
      const data = await fetchGPUPrices({ selectedProvider, selectedGPU });
      console.log('Fetched GPU data:', data);
      setGpuData(data);
    } catch (error) {
      console.error('Error fetching GPU data:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  return {
    gpuData,
    loading,
    error,
    refetch: fetchData
  };
} 