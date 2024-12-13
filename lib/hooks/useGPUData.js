import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useGPUData() {
  const [gpuData, setGpuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGPUData();
  }, []);

  async function fetchGPUData() {
    try {
      const { data, error } = await supabase
        .from('provider_gpus')
        .select(`
          id,
          price_per_hour,
          regions,
          available,
          min_hours,
          providers (
            name,
            website
          ),
          gpu_models (
            name,
            vram,
            cuda_cores
          )
        `)
        .eq('available', true);

      if (error) throw error;
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