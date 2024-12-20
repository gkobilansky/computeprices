import { supabase } from '@/lib/supabase';

export async function fetchGPUData(gpuId) {
  try {
    const { data, error } = await supabase
      .from('gpu_models')
      .select('*')
      .eq('id', gpuId);

    if (error) throw error;

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching GPU data:', error);
    throw error;
  }
} 