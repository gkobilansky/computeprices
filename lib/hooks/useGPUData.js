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
          regions,
          available,
          min_hours,
          latest_price_id,
          providers (
            name,
            website
          ),
          gpu_models (
            name,
            vram,
            cuda_cores
          ),
          gpu_prices (
            price_per_hour,
            timestamp
          )
        `)
        .eq('available', true);

      if (error) throw error;

      // Transform the data to match the existing format
      const transformedData = data.map(item => ({
        ...item,
        price_per_hour: item.gpu_prices.price_per_hour,
        price_timestamp: item.gpu_prices.timestamp
      }));

      setGpuData(transformedData);
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