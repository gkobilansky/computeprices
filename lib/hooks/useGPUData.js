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
      let query = supabase
        .from('prices')
        .select(`
          id,
          provider_id,
          gpu_model_id,
          providers (
            id,
            name,
            website
          ),
          gpu_models (
            id,
            name,
            vram,
            description,
            link
          ),
          price_per_hour,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(1);

      if (selectedProvider) {
        query = query.eq('provider_id', selectedProvider);
      }

      if (selectedGPU) {
        query = query.eq('gpu_model_id', selectedGPU);
      }

      const { data, error } = await query

      if (error) throw error;

      // Transform the data to match the existing format
      const transformedData = data.map(item => ({
        ...item,
        price_per_hour: item.price_per_hour,
        price_created_at: item.created_at
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