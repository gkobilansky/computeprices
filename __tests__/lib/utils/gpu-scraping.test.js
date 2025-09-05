import { extractGPUModel, findMatchingGPUModel, normalizeGPUName, findMatchingGPUModelWithVRAM } from '../../../lib/utils/gpu-scraping.js'

describe('GPU Scraping Utilities', () => {
  describe('extractGPUModel', () => {
    test('should extract RTX 4090', () => {
      expect(extractGPUModel('NVIDIA RTX 4090')).toBe('RTX 4090')
      expect(extractGPUModel('RTX4090')).toBe('RTX 4090')
      expect(extractGPUModel('GeForce RTX 4090')).toBe('RTX 4090')
    })

    test('should extract GH200', () => {
      expect(extractGPUModel('NVIDIA GH200')).toBe('GH200')
      expect(extractGPUModel('GH200 Superchip')).toBe('GH200')
    })

    test('should extract MI300X', () => {
      expect(extractGPUModel('AMD MI300X')).toBe('MI300X')
      expect(extractGPUModel('Instinct MI300X')).toBe('MI300X')
    })

    test('should extract RTX 6000 Ada', () => {
      expect(extractGPUModel('RTX 6000 Ada')).toBe('RTX 6000 ADA')
      expect(extractGPUModel('NVIDIA RTX 6000Ada')).toBe('RTX 6000 ADA')
    })

    test('should extract Ti variants', () => {
      expect(extractGPUModel('RTX 3090 Ti')).toBe('RTX 3090 TI')
      expect(extractGPUModel('GeForce RTX 3090Ti')).toBe('RTX 3090 TI')
    })

    test('should extract L40S', () => {
      expect(extractGPUModel('NVIDIA L40S')).toBe('L40S')
      expect(extractGPUModel('L40S GPU')).toBe('L40S')
    })

    test('should extract Tesla T4', () => {
      expect(extractGPUModel('Tesla T4')).toBe('Tesla T4')
      expect(extractGPUModel('NVIDIA T4')).toBe('Tesla T4')
      expect(extractGPUModel('T4')).toBe('Tesla T4')
    })

    test('should extract A100 variants', () => {
      expect(extractGPUModel('A100_80G')).toBe('A100 SXM')
      expect(extractGPUModel('NVIDIA A100 80GB')).toBe('A100')
    })

    test('should extract L4', () => {
      expect(extractGPUModel('NVIDIA L4')).toBe('L4')
      expect(extractGPUModel('L4 GPU')).toBe('L4')
    })

    test('should extract RTX A4000', () => {
      expect(extractGPUModel('RTX A4000')).toBe('RTX A4000')
      expect(extractGPUModel('NVIDIA A4000')).toBe('RTX A4000')
    })

    test('should handle GPU names with memory sizes', () => {
      expect(extractGPUModel('RTX 4090 24GB')).toBe('RTX 4090')
      expect(extractGPUModel('A100 80GB')).toBe('A100')
    })

    test('should return null for unrecognized patterns', () => {
      expect(extractGPUModel('Unknown GPU')).toBeNull()
      expect(extractGPUModel('CPU Intel i7')).toBeNull()
      expect(extractGPUModel('')).toBeNull()
    })
  })

  describe('normalizeGPUName', () => {
    test('should remove spaces and convert to uppercase', () => {
      expect(normalizeGPUName('RTX 4090')).toBe('RTX4090')
      expect(normalizeGPUName('nvidia rtx 4090')).toBe('NVIDIARTX4090')
    })

    test('should remove memory size suffixes', () => {
      expect(normalizeGPUName('RTX 4090 24GB')).toBe('RTX4090')
      expect(normalizeGPUName('A100 80gb')).toBe('A100')
    })

    test('should remove SXM form factor references', () => {
      expect(normalizeGPUName('A100 SXM4')).toBe('A100')
      expect(normalizeGPUName('H100 SXM5')).toBe('H100')
    })

    test('should remove PCIe references', () => {
      expect(normalizeGPUName('RTX 4090 PCIe')).toBe('RTX4090')
      expect(normalizeGPUName('A100 PCI-E')).toBe('A100')
    })
  })

  describe('findMatchingGPUModel', () => {
    const mockModels = [
      { id: '1', name: 'RTX 4090', vram: 24 },
      { id: '2', name: 'RTX 3090 Ti', vram: 24 },
      { id: '3', name: 'Tesla T4', vram: 16 },
      { id: '4', name: 'A100 SXM', vram: 80 },
      { id: '5', name: 'RTX 6000 Ada', vram: 48 }
    ]

    test('should find exact matches', async () => {
      const result = await findMatchingGPUModel('RTX 4090', mockModels)
      expect(result).toEqual({ id: '1', name: 'RTX 4090', vram: 24 })
    })

    test('should find matches with different formatting', async () => {
      const result = await findMatchingGPUModel('NVIDIA RTX4090 24GB', mockModels)
      expect(result).toEqual({ id: '1', name: 'RTX 4090', vram: 24 })
    })

    test('should find Tesla T4 variants', async () => {
      const result = await findMatchingGPUModel('T4', mockModels)
      expect(result).toEqual({ id: '3', name: 'Tesla T4', vram: 16 })
    })

    test('should find RTX 6000 Ada', async () => {
      const result = await findMatchingGPUModel('RTX 6000Ada', mockModels)
      expect(result).toEqual({ id: '5', name: 'RTX 6000 Ada', vram: 48 })
    })

    test('should return null for no matches', async () => {
      const result = await findMatchingGPUModel('Unknown GPU', mockModels)
      expect(result).toBeNull()
    })
  })

  describe('findMatchingGPUModelWithVRAM', () => {
    const mockModels = [
      { id: '1', name: 'RTX 4090', vram: 24 },
      { id: '2', name: 'A100 SXM', vram: 80 },
      { id: '3', name: 'A100 PCIe', vram: 40 },
      { id: '4', name: 'H100 SXM', vram: 80 }
    ]

    test('should match by model name first', async () => {
      const result = await findMatchingGPUModelWithVRAM('RTX 4090', 24, mockModels)
      expect(result).toEqual({ id: '1', name: 'RTX 4090', vram: 24 })
    })

    test('should match by VRAM when model name is ambiguous', async () => {
      const result = await findMatchingGPUModelWithVRAM('A100', 40, mockModels)
      expect(result).toEqual({ id: '3', name: 'A100 PCIe', vram: 40 })
    })

    test('should prefer exact model match over VRAM match', async () => {
      const result = await findMatchingGPUModelWithVRAM('A100 SXM', 40, mockModels)
      expect(result).toEqual({ id: '2', name: 'A100 SXM', vram: 80 })
    })

    test('should return null when no match found', async () => {
      const result = await findMatchingGPUModelWithVRAM('Unknown', 999, mockModels)
      expect(result).toBeNull()
    })

    test('should work without VRAM size', async () => {
      const result = await findMatchingGPUModelWithVRAM('RTX 4090', null, mockModels)
      expect(result).toEqual({ id: '1', name: 'RTX 4090', vram: 24 })
    })
  })
})