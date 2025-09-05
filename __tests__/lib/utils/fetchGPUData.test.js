import { jest } from '@jest/globals'
import { fetchGPUModels, fetchGPUPrices, fetchProviders, getHomepageStats, fetchProviderComparison, getLatestPriceDrops, getProviderSuggestions } from '../../../lib/utils/fetchGPUData.js'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({ data: mockData.gpuModels, error: null })),
      order: jest.fn(() => ({ data: mockData.providers, error: null })),
      gte: jest.fn(() => ({
        order: jest.fn(() => ({
          limit: jest.fn(() => ({ data: mockData.prices, error: null }))
        }))
      })),
      data: mockData.gpuModels,
      error: null
    }))
  })),
  rpc: jest.fn()
}

jest.mock('../../../lib/supabase.js', () => ({
  supabase: mockSupabase
}))

// Mock data
const mockData = {
  gpuModels: [
    {
      id: 'gpu-1',
      name: 'RTX 4090',
      slug: 'rtx-4090',
      vram: 24,
      manufacturer: 'NVIDIA'
    },
    {
      id: 'gpu-2', 
      name: 'A100 SXM',
      slug: 'a100-sxm',
      vram: 80,
      manufacturer: 'NVIDIA'
    }
  ],
  providers: [
    { id: 'provider-1', name: 'AWS' },
    { id: 'provider-2', name: 'CoreWeave' }
  ],
  prices: [
    {
      id: 'price-1',
      gpu_model_id: 'gpu-1',
      provider_id: 'provider-1',
      price_per_hour: 2.50,
      gpu_count: 1,
      created_at: '2023-01-01T00:00:00Z'
    }
  ]
}

describe('fetchGPUData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mock implementations
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({ data: mockData.gpuModels, error: null })),
        order: jest.fn(() => ({ data: mockData.providers, error: null })),
        gte: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({ data: mockData.prices, error: null }))
          }))
        })),
        data: mockData.gpuModels,
        error: null
      }))
    }))
  })

  describe('fetchGPUModels', () => {
    test('should fetch all GPU models when no ID provided', async () => {
      const result = await fetchGPUModels()
      
      expect(mockSupabase.from).toHaveBeenCalledWith('gpu_models')
      expect(result).toEqual(mockData.gpuModels)
    })

    test('should fetch specific GPU model when ID provided', async () => {
      const mockSingleGPU = [mockData.gpuModels[0]]
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({ data: mockSingleGPU, error: null }))
        }))
      })

      const result = await fetchGPUModels('gpu-1')
      
      expect(result).toEqual(mockData.gpuModels[0])
    })

    test('should return null when GPU not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({ data: [], error: null }))
        }))
      })

      const result = await fetchGPUModels('non-existent')
      
      expect(result).toBeNull()
    })

    test('should throw error when database error occurs', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({ data: null, error: new Error('Database error') })),
          data: null,
          error: new Error('Database error')
        }))
      })

      await expect(fetchGPUModels()).rejects.toThrow('Database error')
    })
  })

  describe('fetchGPUPrices', () => {
    test('should fetch prices with RPC call', async () => {
      const mockPrices = [mockData.prices[0]]
      mockSupabase.rpc.mockResolvedValue({ data: mockPrices, error: null })

      const result = await fetchGPUPrices({})
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_latest_prices', {
        selected_provider: null,
        selected_gpu: null
      })
      expect(result).toEqual(mockPrices)
    })

    test('should filter by provider', async () => {
      const mockPrices = [mockData.prices[0]]
      mockSupabase.rpc.mockResolvedValue({ data: mockPrices, error: null })

      await fetchGPUPrices({ selectedProvider: 'provider-1' })
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_latest_prices', {
        selected_provider: 'provider-1',
        selected_gpu: null
      })
    })

    test('should filter by GPU', async () => {
      const mockPrices = [mockData.prices[0]]
      mockSupabase.rpc.mockResolvedValue({ data: mockPrices, error: null })

      await fetchGPUPrices({ selectedGPU: 'gpu-1' })
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_latest_prices', {
        selected_provider: null,
        selected_gpu: 'gpu-1'
      })
    })

    test('should handle multiple providers', async () => {
      const mockPrices = [mockData.prices[0]]
      mockSupabase.rpc.mockResolvedValue({ data: mockPrices, error: null })

      const result = await fetchGPUPrices({ 
        selectedProviders: ['provider-1', 'provider-2'] 
      })
      
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(2)
      expect(result).toEqual([mockData.prices[0], mockData.prices[0]]) // Flattened results
    })

    test('should throw error when RPC fails', async () => {
      mockSupabase.rpc.mockResolvedValue({ 
        data: null, 
        error: new Error('RPC error') 
      })

      await expect(fetchGPUPrices({})).rejects.toThrow('RPC error')
    })
  })

  describe('fetchProviders', () => {
    test('should fetch all providers ordered by name', async () => {
      const result = await fetchProviders()
      
      expect(mockSupabase.from).toHaveBeenCalledWith('providers')
      expect(result).toEqual(mockData.providers)
    })

    test('should throw error when database error occurs', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          order: jest.fn(() => ({ data: null, error: new Error('Database error') }))
        }))
      })

      await expect(fetchProviders()).rejects.toThrow('Database error')
    })
  })

  describe('getHomepageStats', () => {
    test('should return stats from database', async () => {
      // Mock count queries
      mockSupabase.from.mockImplementation((table) => ({
        select: jest.fn(() => {
          if (table === 'gpu_models') {
            return { data: new Array(50), error: null }
          } else if (table === 'providers') {
            return { data: new Array(11), error: null }  
          } else if (table === 'prices') {
            return { data: new Array(500), error: null }
          }
          return { data: [], error: null }
        })
      }))

      const result = await getHomepageStats()
      
      expect(result).toEqual({
        gpuCount: 50,
        providerCount: 11,
        pricePointsChecked: 500
      })
    })

    test('should return fallback values on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({ data: null, error: new Error('Database error') }))
      })

      const result = await getHomepageStats()
      
      expect(result).toEqual({
        gpuCount: 50,
        providerCount: 11,
        pricePointsChecked: 500
      })
    })
  })

  describe('getLatestPriceDrops', () => {
    test('should return mock price alert', async () => {
      const result = await getLatestPriceDrops()
      
      expect(result).toMatchObject({
        hasAlert: expect.any(Boolean),
        message: expect.any(String),
        alertType: expect.any(String)
      })
    })

    test('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            order: jest.fn(() => ({
              limit: jest.fn(() => ({ data: null, error: new Error('Database error') }))
            }))
          }))
        }))
      })

      const result = await getLatestPriceDrops()
      
      expect(result).toMatchObject({
        hasAlert: false,
        message: 'No recent price changes detected',
        alertType: 'none'
      })
    })
  })
})