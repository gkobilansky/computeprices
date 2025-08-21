import { GPUModel, GPUPrice } from './index'

// Provider information types
export interface Provider {
  id: string
  name: string
  slug: string
  description?: string
  link?: string
  docsLink?: string
  features?: ProviderFeature[]
  pros?: string[]
  cons?: string[]
  gettingStarted?: GettingStartedStep[]
  computeServices?: ComputeService[]
  gpuServices?: GPUService[]
  pricingOptions?: PricingOption[]
  regions?: string
  support?: string
  uniqueSellingPoints?: string[]
  isMinimal?: boolean
}

export interface ProviderFeature {
  title: string
  description: string
}

export interface GettingStartedStep {
  title: string
  description: string
}

export interface ComputeService {
  name: string
  description: string
  instanceTypes?: InstanceType[]
  features?: string[]
}

export interface InstanceType {
  name: string
  description: string
  features: string[]
}

export interface GPUService {
  name: string
  description: string
  types?: GPUServiceType[]
  features?: string[]
}

export interface GPUServiceType {
  name: string
  gpuModel: string
  bestFor: string
}

export interface PricingOption {
  name: string
  description: string
}

// Comparison-specific types
export interface ProviderComparison {
  provider1: Provider
  provider2: Provider
  gpuPrices1: ProviderGPUPrices
  gpuPrices2: ProviderGPUPrices
  metadata: ComparisonMetadata
}

export interface ProviderGPUPrices {
  providerId: string
  providerName: string
  prices: (GPUPrice & {
    gpu_model_name: string
    gpu_model_slug: string
    vram: number
    manufacturer: string
  })[]
}

export interface ComparisonMetadata {
  title: string
  description: string
  canonical_url: string
  provider1_slug: string
  provider2_slug: string
  comparison_type: 'bidirectional' // future: 'multi-provider'
  generated_at: string
}

// URL parsing types
export interface ParsedProviderSlugs {
  provider1: string
  provider2: string
  isValid: boolean
  format: ProviderURLFormat
  error?: string
}

export enum ProviderURLFormat {
  DASH_VS = 'dash-vs', // aws-vs-coreweave
  SLASH_VS = 'slash-vs', // aws/vs/coreweave  
  COMMA = 'comma', // aws,coreweave
  INVALID = 'invalid'
}

// Validation types
export interface ProviderValidationResult {
  isValid: boolean
  provider?: Provider
  error?: string
}

export interface ComparisonValidationResult {
  isValid: boolean
  provider1?: Provider
  provider2?: Provider
  error?: string
  errorType?: 'INVALID_FORMAT' | 'PROVIDER_NOT_FOUND' | 'SAME_PROVIDER' | 'UNKNOWN'
}

// Error types
export class ComparisonError extends Error {
  constructor(
    message: string,
    public errorType: ComparisonValidationResult['errorType'],
    public provider1Slug?: string,
    public provider2Slug?: string
  ) {
    super(message)
    this.name = 'ComparisonError'
  }
}