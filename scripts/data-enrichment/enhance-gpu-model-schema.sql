-- Migration script to enhance gpu_models table with additional fields
-- This script adds fields needed for a more detailed GPU product page

-- Add image_url field for GPU images
ALTER TABLE gpu_models 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add compute_units field if it doesn't exist 
-- (it was referenced in the page but might not be in the table)
ALTER TABLE gpu_models 
ADD COLUMN IF NOT EXISTS compute_units INTEGER;

-- Add technical specifications fields
ALTER TABLE gpu_models 
ADD COLUMN IF NOT EXISTS cuda_cores INTEGER,
ADD COLUMN IF NOT EXISTS tensor_cores INTEGER,
ADD COLUMN IF NOT EXISTS rt_cores INTEGER,
ADD COLUMN IF NOT EXISTS memory_bandwidth_gbps INTEGER,
ADD COLUMN IF NOT EXISTS memory_interface_bit INTEGER,
ADD COLUMN IF NOT EXISTS manufacturing_process_nm INTEGER,
ADD COLUMN IF NOT EXISTS tdp_watt INTEGER,
ADD COLUMN IF NOT EXISTS max_power_watt INTEGER,
ADD COLUMN IF NOT EXISTS release_date DATE,
ADD COLUMN IF NOT EXISTS end_of_life_date DATE;

-- Add performance fields
ALTER TABLE gpu_models 
ADD COLUMN IF NOT EXISTS fp16_performance_tflops NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS fp32_performance_tflops NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS fp64_performance_tflops NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS int8_performance_tops NUMERIC(10, 2);

-- Add benchmark scores
ALTER TABLE gpu_models 
ADD COLUMN IF NOT EXISTS ml_perf_inference_score NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS ml_perf_training_score NUMERIC(10, 2);

-- Add fields for market data
ALTER TABLE gpu_models 
ADD COLUMN IF NOT EXISTS msrp_usd INTEGER,
ADD COLUMN IF NOT EXISTS server_gpu BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cloud_compatible BOOLEAN DEFAULT TRUE;

-- Add detailed content fields
ALTER TABLE gpu_models 
ADD COLUMN IF NOT EXISTS detailed_description TEXT,
ADD COLUMN IF NOT EXISTS pros TEXT[],
ADD COLUMN IF NOT EXISTS cons TEXT[],
ADD COLUMN IF NOT EXISTS features TEXT[];

-- Add related link fields
ALTER TABLE gpu_models 
ADD COLUMN IF NOT EXISTS benchmark_links JSONB,
ADD COLUMN IF NOT EXISTS affiliate_links JSONB;

-- Add specification comparison helper fields
ALTER TABLE gpu_models 
ADD COLUMN IF NOT EXISTS performance_tier TEXT CHECK (performance_tier IN ('entry', 'mid', 'high', 'ultra')),
ADD COLUMN IF NOT EXISTS generation INTEGER; 