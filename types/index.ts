export interface GPUProvider {
  id: string
  name: string
  website: string
  regions: string[]
  pricing: {
    [gpuModel: string]: {
      pricePerHour: number
      available: boolean
      minHours?: number
      specs?: {
        vram: number
        cuda_cores?: number
      }
    }
  }
} 