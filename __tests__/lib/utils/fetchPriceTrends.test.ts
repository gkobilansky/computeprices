import { fetchPriceTrends } from '../../../lib/utils/fetchPriceTrends';

jest.mock('../../../lib/supabase-admin', () => ({
  supabaseAdmin: {
    rpc: jest.fn()
  }
}));

const { supabaseAdmin } = jest.requireMock('../../../lib/supabase-admin');

describe('fetchPriceTrends', () => {
  beforeEach(() => {
    supabaseAdmin.rpc.mockReset();
  });

  it('normalizes RPC data and bounds the days parameter', async () => {
    supabaseAdmin.rpc.mockResolvedValue({
      data: [
        { day: '2025-01-01', avg_price_per_hour: '1.23', provider_count: 3 },
        { day: '2025-01-02', avg_price_per_hour: '2.34', provider_count: 4 }
      ],
      error: null
    });

    const result = await fetchPriceTrends({ gpuId: 'gpu-123', days: 400 });

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_gpu_daily_trends', {
      selected_gpu: 'gpu-123',
      days: 90
    });
    expect(result).toEqual([
      { day: '2025-01-01', avgPricePerHour: 1.23, providerCount: 3 },
      { day: '2025-01-02', avgPricePerHour: 2.34, providerCount: 4 }
    ]);
  });

  it('throws when the RPC returns an error', async () => {
    supabaseAdmin.rpc.mockResolvedValue({
      data: null,
      error: new Error('boom')
    });

    await expect(fetchPriceTrends({ gpuId: 'gpu-123', days: 7 })).rejects.toThrow('boom');
  });
});
