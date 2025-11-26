import { fetchProviderComparison } from '../../../lib/utils/fetchGPUData'

const mockRpc = jest.fn()
const mockOrder = jest.fn()
const mockSelect = jest.fn(() => ({ order: mockOrder }))
const mockFrom = jest.fn(() => ({ select: mockSelect }))

jest.mock('../../../lib/supabase.js', () => ({
  supabase: {
    rpc: (...args: any[]) => mockRpc(...args),
    from: (...args: any[]) => mockFrom(...args),
  },
}))

describe('fetchProviderComparison - slugs', () => {
  beforeEach(() => {
    mockRpc.mockReset()
    mockFrom.mockClear()
    mockSelect.mockClear()
    mockOrder.mockClear()
  })

  test('uses canonical provider slugs (with fallback to name slug)', async () => {
    const provider1Id = 'provider-1'
    const provider2Id = 'provider-2'

    const provider1Prices = [
      {
        gpu_model_id: 'gpu-1',
        gpu_model_name: 'A10',
        gpu_model_vram: 24,
        price_per_hour: 1.63,
        gpu_count: 1,
        manufacturer: 'NVIDIA',
      },
    ]

    const provider2Prices = [
      {
        gpu_model_id: 'gpu-1',
        gpu_model_name: 'A10',
        gpu_model_vram: 24,
        price_per_hour: 0.75,
        gpu_count: 1,
        manufacturer: 'NVIDIA',
      },
    ]

    mockRpc.mockImplementation((fnName: string, params: any) => {
      if (fnName === 'get_latest_prices') {
        if (params.selected_provider === provider1Id) {
          return Promise.resolve({ data: provider1Prices, error: null })
        }
        if (params.selected_provider === provider2Id) {
          return Promise.resolve({ data: provider2Prices, error: null })
        }
      }
      return Promise.resolve({ data: [], error: null })
    })

    mockOrder.mockResolvedValue({
      data: [
        { id: provider1Id, name: 'Amazon AWS', slug: 'aws' },
        { id: provider2Id, name: 'Lambda Labs' }, // no slug -> fallback slugify
      ],
      error: null,
    })

    const result = await fetchProviderComparison(provider1Id, provider2Id)

    expect(result.provider1.slug).toBe('aws')
    expect(result.provider2.slug).toBe('lambda-labs')

    const row = result.comparisonData[0]
    expect(row.provider1?.provider_slug).toBe('aws')
    expect(row.provider2?.provider_slug).toBe('lambda-labs')
  })
})
