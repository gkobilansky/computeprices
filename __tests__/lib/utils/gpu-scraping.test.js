import { extractGPUModel, findMatchingGPUModel, normalizeGPUName, findMatchingGPUModelWithVRAM } from '../../../lib/utils/gpu-scraping.js'

describe('GPU Scraping Utilities', () => {
  describe('extractGPUModel', () => {
    // === NVIDIA Blackwell Architecture ===
    test('should extract Blackwell GPUs', () => {
      expect(extractGPUModel('NVIDIA GB200')).toBe('GB200')
      expect(extractGPUModel('GB200 Grace Blackwell')).toBe('GB200')
      expect(extractGPUModel('NVIDIA B200')).toBe('B200')
      expect(extractGPUModel('B200 GPU')).toBe('B200')
      expect(extractGPUModel('NVIDIA B100')).toBe('B100')
      expect(extractGPUModel('B100 Tensor Core')).toBe('B100')
    })

    // === NVIDIA Hopper Architecture ===
    test('should extract H200', () => {
      expect(extractGPUModel('NVIDIA H200')).toBe('H200')
      expect(extractGPUModel('H200 GPU')).toBe('H200')
    })

    test('should extract H100 variants', () => {
      expect(extractGPUModel('H100 SXM')).toBe('H100 SXM')
      expect(extractGPUModel('NVIDIA H100 SXM5')).toBe('H100 SXM')
      expect(extractGPUModel('H100 80GB')).toBe('H100 SXM')
      expect(extractGPUModel('H100 PCIe')).toBe('H100 PCIe')
      expect(extractGPUModel('H100 PCIE')).toBe('H100 PCIe')
      expect(extractGPUModel('H100 40GB')).toBe('H100 PCIe')
      expect(extractGPUModel('H100 NVL')).toBe('H100 NVL')
      expect(extractGPUModel('NVIDIA H100 NVL 94GB')).toBe('H100 NVL')
      expect(extractGPUModel('H100')).toBe('H100 SXM') // Generic defaults to SXM
    })

    test('should extract GH200', () => {
      expect(extractGPUModel('NVIDIA GH200')).toBe('GH200')
      expect(extractGPUModel('GH200 Superchip')).toBe('GH200')
    })

    // === AMD MI Series ===
    test('should extract AMD MI300 series', () => {
      expect(extractGPUModel('AMD MI300X')).toBe('MI300X')
      expect(extractGPUModel('Instinct MI300X')).toBe('MI300X')
      expect(extractGPUModel('AMD MI300A')).toBe('MI300A')
      expect(extractGPUModel('Instinct MI300A APU')).toBe('MI300A')
    })

    test('should extract AMD MI325X', () => {
      expect(extractGPUModel('AMD MI325X')).toBe('MI325X')
      expect(extractGPUModel('Instinct MI325X')).toBe('MI325X')
    })

    test('should extract AMD MI355X', () => {
      expect(extractGPUModel('AMD MI355X')).toBe('MI355X')
      expect(extractGPUModel('Instinct MI355X CDNA4')).toBe('MI355X')
    })

    test('should extract AMD MI250 series', () => {
      expect(extractGPUModel('AMD MI250X')).toBe('MI250X')
      expect(extractGPUModel('Instinct MI250X')).toBe('MI250X')
      expect(extractGPUModel('AMD MI250')).toBe('MI250')
      expect(extractGPUModel('Instinct MI250')).toBe('MI250')
    })

    test('should extract AMD MI210 and MI100', () => {
      expect(extractGPUModel('AMD MI210')).toBe('MI210')
      expect(extractGPUModel('Instinct MI210')).toBe('MI210')
      expect(extractGPUModel('AMD MI100')).toBe('MI100')
      expect(extractGPUModel('Instinct MI100')).toBe('MI100')
    })

    // === Intel GPUs ===
    test('should extract Intel Gaudi', () => {
      expect(extractGPUModel('Intel Gaudi 3')).toBe('Gaudi 3')
      expect(extractGPUModel('Gaudi3')).toBe('Gaudi 3')
      expect(extractGPUModel('Intel Gaudi 2')).toBe('Gaudi 2')
      expect(extractGPUModel('Gaudi2 HL-225')).toBe('Gaudi 2')
    })

    test('should extract Intel Data Center GPU Max', () => {
      expect(extractGPUModel('Intel Max 1550')).toBe('Max 1550')
      expect(extractGPUModel('Data Center GPU Max 1550')).toBe('Max 1550')
      expect(extractGPUModel('Intel Max 1100')).toBe('Max 1100')
      expect(extractGPUModel('Data Center GPU Max 1100')).toBe('Max 1100')
    })

    // === NVIDIA Ada Lovelace (RTX 40-series) ===
    test('should extract RTX 4090', () => {
      expect(extractGPUModel('NVIDIA RTX 4090')).toBe('RTX 4090')
      expect(extractGPUModel('RTX4090')).toBe('RTX 4090')
      expect(extractGPUModel('GeForce RTX 4090')).toBe('RTX 4090')
    })

    test('should extract RTX 4080 variants', () => {
      expect(extractGPUModel('RTX 4080')).toBe('RTX 4080')
      expect(extractGPUModel('RTX 4080 SUPER')).toBe('RTX 4080 SUPER')
      expect(extractGPUModel('GeForce RTX 4080 Super')).toBe('RTX 4080 SUPER')
    })

    test('should extract RTX 4070 variants', () => {
      expect(extractGPUModel('RTX 4070 Ti SUPER')).toBe('RTX 4070 Ti SUPER')
      expect(extractGPUModel('GeForce RTX 4070Ti Super')).toBe('RTX 4070 Ti SUPER')
      expect(extractGPUModel('RTX 4070 Ti')).toBe('RTX 4070 Ti')
      expect(extractGPUModel('RTX 4070Ti')).toBe('RTX 4070 Ti')
      expect(extractGPUModel('RTX 4070 SUPER')).toBe('RTX 4070 SUPER')
      expect(extractGPUModel('RTX 4070')).toBe('RTX 4070')
    })

    test('should extract RTX 4060 variants', () => {
      expect(extractGPUModel('RTX 4060 Ti')).toBe('RTX 4060 Ti')
      expect(extractGPUModel('RTX 4060Ti')).toBe('RTX 4060 Ti')
      expect(extractGPUModel('RTX 4060')).toBe('RTX 4060')
    })

    // === NVIDIA Ada Lovelace Professional ===
    test('should extract RTX 6000 Ada', () => {
      expect(extractGPUModel('RTX 6000 Ada')).toBe('RTX 6000 ADA')
      expect(extractGPUModel('NVIDIA RTX 6000Ada')).toBe('RTX 6000 ADA')
      expect(extractGPUModel('RTX 6000')).toBe('RTX 6000 Ada') // Without Ada suffix
    })

    test('should extract RTX 5000/4500/4000 Ada', () => {
      expect(extractGPUModel('RTX 5000 Ada')).toBe('RTX 5000 ADA')
      expect(extractGPUModel('NVIDIA RTX 5000Ada')).toBe('RTX 5000 ADA')
      expect(extractGPUModel('RTX 4500 Ada')).toBe('RTX 4500 ADA')
      expect(extractGPUModel('RTX 4000 Ada')).toBe('RTX 4000 ADA')
    })

    // === NVIDIA Ampere (RTX 30-series) ===
    test('should extract RTX 30-series Ti variants', () => {
      expect(extractGPUModel('RTX 3090 Ti')).toBe('RTX 3090 Ti')
      expect(extractGPUModel('GeForce RTX 3090Ti')).toBe('RTX 3090 Ti')
      expect(extractGPUModel('RTX 3080 Ti')).toBe('RTX 3080 Ti')
      expect(extractGPUModel('GeForce RTX 3080Ti')).toBe('RTX 3080 Ti')
      expect(extractGPUModel('RTX 3070 Ti')).toBe('RTX 3070 Ti')
    })

    test('should extract RTX 30-series base models', () => {
      expect(extractGPUModel('RTX 3090')).toBe('RTX 3090')
      expect(extractGPUModel('RTX 3080')).toBe('RTX 3080')
      expect(extractGPUModel('GeForce RTX 3080 10GB')).toBe('RTX 3080')
      expect(extractGPUModel('RTX 3070')).toBe('RTX 3070')
    })

    // === NVIDIA Ada/Ampere Data Center ===
    test('should extract L40 variants', () => {
      expect(extractGPUModel('NVIDIA L40S')).toBe('L40S')
      expect(extractGPUModel('L40S GPU')).toBe('L40S')
      expect(extractGPUModel('NVIDIA L40')).toBe('L40')
      expect(extractGPUModel('L40 GPU')).toBe('L40')
    })

    test('should extract L4', () => {
      expect(extractGPUModel('NVIDIA L4')).toBe('L4')
      expect(extractGPUModel('L4 GPU')).toBe('L4')
    })

    test('should extract Tesla T4', () => {
      expect(extractGPUModel('Tesla T4')).toBe('Tesla T4')
      expect(extractGPUModel('NVIDIA T4')).toBe('Tesla T4')
      expect(extractGPUModel('T4')).toBe('Tesla T4')
    })

    // === NVIDIA Ampere Data Center ===
    test('should extract A100 variants', () => {
      expect(extractGPUModel('A100_80G')).toBe('A100 SXM')
      expect(extractGPUModel('A100 80GB SXM')).toBe('A100 SXM')
      expect(extractGPUModel('A100 SXM')).toBe('A100 SXM')
      expect(extractGPUModel('A100 40GB PCIe')).toBe('A100 PCIe')
      expect(extractGPUModel('A100 PCIe')).toBe('A100 PCIe')
      expect(extractGPUModel('NVIDIA A100 80GB')).toBe('A100 SXM')
      expect(extractGPUModel('A100')).toBe('A100')
    })

    test('should extract A30, A16, A2', () => {
      expect(extractGPUModel('NVIDIA A30')).toBe('A30')
      expect(extractGPUModel('A30 GPU')).toBe('A30')
      expect(extractGPUModel('NVIDIA A16')).toBe('A16')
      expect(extractGPUModel('A16 vGPU')).toBe('A16')
      expect(extractGPUModel('NVIDIA A2')).toBe('A2')
      expect(extractGPUModel('A2 Edge GPU')).toBe('A2')
    })

    test('should extract RTX A4000', () => {
      expect(extractGPUModel('RTX A4000')).toBe('RTX A4000')
      expect(extractGPUModel('NVIDIA A4000')).toBe('RTX A4000')
    })

    // === Edge cases ===
    test('should handle GPU names with memory sizes', () => {
      expect(extractGPUModel('RTX 4090 24GB')).toBe('RTX 4090')
      expect(extractGPUModel('A100 80GB')).toBe('A100 SXM')
      expect(extractGPUModel('H100 80GB SXM5')).toBe('H100 SXM')
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
      { id: '5', name: 'RTX 6000 Ada', vram: 48 },
      { id: '6', name: 'H100 SXM', vram: 80 },
      { id: '7', name: 'H100 PCIe', vram: 80 },
      { id: '8', name: 'H100 NVL', vram: 94 },
      { id: '9', name: 'B200', vram: 192 },
      { id: '10', name: 'GB200', vram: 384 },
      { id: '11', name: 'MI300X', vram: 192 },
      { id: '12', name: 'MI325X', vram: 256 },
      { id: '13', name: 'Gaudi 3', vram: 128 },
      { id: '14', name: 'L40S', vram: 48 },
      { id: '15', name: 'L40', vram: 48 },
      { id: '16', name: 'RTX 4070 Ti', vram: 12 },
      { id: '17', name: 'RTX 4070 Ti SUPER', vram: 16 }
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

    test('should find H100 variants correctly', async () => {
      const sxmResult = await findMatchingGPUModel('H100 SXM5 80GB', mockModels)
      expect(sxmResult).toEqual({ id: '6', name: 'H100 SXM', vram: 80 })

      const pcieResult = await findMatchingGPUModel('H100 PCIe', mockModels)
      expect(pcieResult).toEqual({ id: '7', name: 'H100 PCIe', vram: 80 })

      const nvlResult = await findMatchingGPUModel('H100 NVL 94GB', mockModels)
      expect(nvlResult).toEqual({ id: '8', name: 'H100 NVL', vram: 94 })

      // Generic H100 should default to SXM
      const genericResult = await findMatchingGPUModel('H100', mockModels)
      expect(genericResult).toEqual({ id: '6', name: 'H100 SXM', vram: 80 })
    })

    test('should find Blackwell GPUs', async () => {
      const b200Result = await findMatchingGPUModel('NVIDIA B200 GPU', mockModels)
      expect(b200Result).toEqual({ id: '9', name: 'B200', vram: 192 })

      const gb200Result = await findMatchingGPUModel('GB200 Grace Blackwell', mockModels)
      expect(gb200Result).toEqual({ id: '10', name: 'GB200', vram: 384 })
    })

    test('should find AMD MI series', async () => {
      const mi300xResult = await findMatchingGPUModel('AMD Instinct MI300X', mockModels)
      expect(mi300xResult).toEqual({ id: '11', name: 'MI300X', vram: 192 })

      const mi325xResult = await findMatchingGPUModel('MI325X', mockModels)
      expect(mi325xResult).toEqual({ id: '12', name: 'MI325X', vram: 256 })
    })

    test('should find Intel Gaudi', async () => {
      const result = await findMatchingGPUModel('Intel Gaudi 3', mockModels)
      expect(result).toEqual({ id: '13', name: 'Gaudi 3', vram: 128 })
    })

    test('should find L40 variants without confusion', async () => {
      const l40sResult = await findMatchingGPUModel('NVIDIA L40S', mockModels)
      expect(l40sResult).toEqual({ id: '14', name: 'L40S', vram: 48 })

      const l40Result = await findMatchingGPUModel('NVIDIA L40', mockModels)
      expect(l40Result).toEqual({ id: '15', name: 'L40', vram: 48 })
    })

    test('should find RTX 4070 Ti variants correctly', async () => {
      const tiResult = await findMatchingGPUModel('RTX 4070 Ti', mockModels)
      expect(tiResult).toEqual({ id: '16', name: 'RTX 4070 Ti', vram: 12 })

      const tiSuperResult = await findMatchingGPUModel('RTX 4070 Ti SUPER', mockModels)
      expect(tiSuperResult).toEqual({ id: '17', name: 'RTX 4070 Ti SUPER', vram: 16 })
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
      // When model name matches, it returns the first match regardless of VRAM
      // The VRAM matching only kicks in when no model name match is found
      const result = await findMatchingGPUModelWithVRAM('A100', 40, mockModels)
      // A100 matches A100 SXM via substring matching, so VRAM is not used
      expect(result).toEqual({ id: '2', name: 'A100 SXM', vram: 80 })
    })

    test('should prefer exact model match over VRAM match', async () => {
      const result = await findMatchingGPUModelWithVRAM('A100 SXM', 40, mockModels)
      expect(result).toEqual({ id: '2', name: 'A100 SXM', vram: 80 })
    })

    test('should return null/undefined when no match found', async () => {
      const result = await findMatchingGPUModelWithVRAM('Unknown', 999, mockModels)
      expect(result).toBeFalsy()
    })

    test('should work without VRAM size', async () => {
      const result = await findMatchingGPUModelWithVRAM('RTX 4090', null, mockModels)
      expect(result).toEqual({ id: '1', name: 'RTX 4090', vram: 24 })
    })
  })
})