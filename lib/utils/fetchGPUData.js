import { supabase } from '@/lib/supabase';

export async function fetchGPUModels(gpuId = null) {
  console.log('fetchGPUModels called with gpuId:', gpuId);
  try {
    let query = supabase.from('gpu_models').select('*');
    
    if (gpuId) {
      query = query.eq('id', gpuId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return gpuId ? (data && data.length > 0 ? data[0] : null) : data;
  } catch (error) {
    console.error('Error fetching GPU models:', error);
    throw error;
  }
}

export async function fetchGPUPrices({ selectedProvider, selectedGPU }) {
  console.log('fetchGPUPrices called with selectedProvider:', selectedProvider);
  console.log('fetchGPUPrices called with selectedGPU:', selectedGPU);
  try {
    const providerUUID = selectedProvider ? selectedProvider.toString() : null;
    const gpuUUID = selectedGPU ? selectedGPU.toString() : null;

    const { data, error } = await supabase.rpc('get_latest_prices', {
      selected_provider: providerUUID,
      selected_gpu: gpuUUID
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching GPU prices:', error);
    throw error;
  }
} 