import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useGPUData({ selectedProvider = null, selectedGPU = null }) {
  const [gpuData, setGpuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGPUData();
  }, []);

  async function fetchGPUData() {
    try {
      // Ensure selectedProvider and selectedGPU are UUIDs
      const providerUUID = selectedProvider ? selectedProvider.toString() : null;
      const gpuUUID = selectedGPU ? selectedGPU.toString() : null;

      let query = supabase
        .rpc('get_latest_prices', {
          selected_provider: providerUUID,
          selected_gpu: gpuUUID
        });

      const { data, error } = await query;
      if (error) throw error;

      console.log(data)

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
    refetch: fetchGPUData
  };
} 