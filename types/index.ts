export interface GPU {
  id: string
  name: string
  vram: number
  description: string
  link: string
}

export interface GPUProvider {
  id: string
  name: string
  website: string
  regions: string[]
}

export interface GPUPrice {
  id: string
  provider_id: string
  gpu_model_id: string
  price_per_hour: number
  created_at: string
}