export interface GPUModel {
  id: string
  name: string
  manufacturer: string
  architecture: string
  vram: number
  slug: string
  created_at: string
  link: string
  use_case?: string
  description?: string
}

export interface GPUDetails {
  id: string
  gpu_model_id: string
  cuda_cores?: number
  tensor_cores?: number
  base_clock_mhz?: number
  boost_clock_mhz?: number
  memory_type?: string
  memory_bandwidth_gbps?: number
  power_watts?: number
  interface?: string
  extra_specs?: Record<string, unknown>
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
  source: string
  created_at: string
}