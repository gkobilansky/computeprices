import { supabase } from '@/lib/supabase';

export async function fetchLatestPriceDate() {
  try {
    const { data, error } = await supabase
      .from('prices')
      .select('price_per_hour, created_at')
      .order('created_at', { ascending: false })
      .order('price_per_hour', { ascending: false })
      .limit(1);

    if (error) throw error;

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching latest price data:', error);
    throw error;
  }
} 