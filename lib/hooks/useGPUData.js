import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useGPUData({ selectedProvider = null }) {
  const [gpuData, setGpuData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGPUData();
  }, []);

  async function fetchGPUData() {
    try {
      let query = supabase
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
            created_at
          )
        `)
        .eq('available', true)

      if (selectedProvider) {
        query = query.eq('providers.name', selectedProvider)
      }

      const { data, error } = await query

      if (error) throw error;

      // Transform the data to match the existing format
      const transformedData = data.map(item => ({
        ...item,
        price_per_hour: item.gpu_prices.price_per_hour,
        price_created_at: item.gpu_prices.created_at
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