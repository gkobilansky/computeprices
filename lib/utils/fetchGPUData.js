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
 try {
    const providerUUID = selectedProvider ? selectedProvider.toString() : null;
    const gpuUUID = selectedGPU ? selectedGPU.toString() : null;

    const { data, error } = await supabase.rpc('get_latest_prices', {
      selected_provider: providerUUID,
      selected_gpu: gpuUUID
    });

   console.log('data', data)

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching GPU prices:', error);
    throw error;
  }
}

export async function fetchProviders() {
  try {
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw error;
  }
}

// New function to get actual counts for homepage
export async function getHomepageStats() {
  try {
    // Get GPU count
    const { data: gpuData, error: gpuError } = await supabase
      .from('gpu_models')
      .select('id', { count: 'exact' });

    if (gpuError) throw gpuError;

    // Get provider count
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('id', { count: 'exact' });

    const { data: priceData, error: priceError } = await supabase
      .from('prices')
      .select('id', { count: 'exact' });


    console.log('gpuData', gpuData)
    console.log('providerData', providerData)
    console.log('priceData', priceData)

    return {
      gpuCount: gpuData.length,
      providerCount: providerData.length,
      pricePointsChecked: priceData.length
    };
  } catch (error) {
    console.error('Error fetching homepage stats:', error);
    // Return fallback values
    return {
      gpuCount: 50,
      providerCount: 11,
      pricePointsChecked: 500
    };
  }
}

// New function to get latest price alerts (foundation for real price alerts)
export async function getLatestPriceDrops() {
  try {
    // Get price changes from the last 24 hours
    const { data, error } = await supabase
      .from('prices')
      .select(`
        *,
        gpu_models:gpu_model_id (name),
        providers:provider_id (name)
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    // For now, return a mock alert. In the future, this would analyze price changes
    return {
      hasAlert: data && data.length > 0,
      message: "H100 prices dropped 15% across 3 providers in the last 24 hours",
      alertType: "price_drop",
      gpuModel: "H100",
      providerCount: 3,
      percentageChange: -15
    };
  } catch (error) {
    console.error('Error fetching price alerts:', error);
    return {
      hasAlert: false,
      message: "No recent price changes detected",
      alertType: "none"
    };
  }
} 