-- Initial schema for ComputePrices database

-- Create providers table
CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pricing_page TEXT,
    slug TEXT
);

-- Create performance tier enum
DO $$ BEGIN
    CREATE TYPE gpu_manufacturer AS ENUM ('NVIDIA', 'AMD', 'Intel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create gpu_models table
CREATE TABLE IF NOT EXISTS gpu_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    vram INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    manufacturer gpu_manufacturer,
    link TEXT,
    architecture TEXT,
    use_cases TEXT,
    description TEXT,
    slug TEXT,
    image_url TEXT,
    compute_units INTEGER,
    cuda_cores INTEGER,
    tensor_cores INTEGER,
    rt_cores INTEGER,
    memory_bandwidth_gbps INTEGER,
    memory_interface_bit INTEGER,
    manufacturing_process_nm INTEGER,
    tdp_watt INTEGER,
    max_power_watt INTEGER,
    release_date DATE,
    end_of_life_date DATE,
    fp16_performance_tflops NUMERIC(10,2),
    fp32_performance_tflops NUMERIC(10,2),
    fp64_performance_tflops NUMERIC(10,2),
    int8_performance_tops NUMERIC(10,2),
    ml_perf_inference_score NUMERIC(10,2),
    ml_perf_training_score NUMERIC(10,2),
    msrp_usd INTEGER,
    server_gpu BOOLEAN DEFAULT FALSE,
    cloud_compatible BOOLEAN DEFAULT TRUE,
    detailed_description TEXT,
    pros TEXT[],
    cons TEXT[],
    features TEXT[],
    benchmark_links JSONB,
    affiliate_links JSONB,
    performance_tier TEXT CHECK (performance_tier IN ('entry', 'mid', 'high', 'ultra')),
    generation INTEGER
);

-- Create prices table
CREATE TABLE IF NOT EXISTS prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    gpu_model_id UUID NOT NULL REFERENCES gpu_models(id) ON DELETE CASCADE,
    price_per_hour DECIMAL(10,4) NOT NULL,
    gpu_count INTEGER DEFAULT 1,
    source_name TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prices_provider_id ON prices(provider_id);
CREATE INDEX IF NOT EXISTS idx_prices_gpu_model_id ON prices(gpu_model_id);
CREATE INDEX IF NOT EXISTS idx_prices_created_at ON prices(created_at);

-- Enable Row Level Security
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpu_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Allow public read access to providers" ON providers;
CREATE POLICY "Allow public read access to providers"
    ON providers FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public read access to gpu_models" ON gpu_models;
CREATE POLICY "Allow public read access to gpu_models"
    ON gpu_models FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow public read access to prices" ON prices;
CREATE POLICY "Allow public read access to prices"
    ON prices FOR SELECT
    USING (true);

-- Create the get_latest_prices stored procedure
CREATE OR REPLACE FUNCTION get_latest_prices(
    selected_provider UUID DEFAULT NULL,
    selected_gpu UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    provider_id UUID,
    gpu_model_id UUID,
    price_per_hour DECIMAL,
    gpu_count INTEGER,
    source_name TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    provider_name TEXT,
    gpu_model_name TEXT,
    gpu_model_slug TEXT,
    gpu_model_vram INTEGER,
    manufacturer TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (p.provider_id, p.gpu_model_id)
        p.id,
        p.provider_id,
        p.gpu_model_id,
        p.price_per_hour,
        p.gpu_count,
        p.source_name,
        p.source_url,
        p.created_at,
        pr.name as provider_name,
        gm.name as gpu_model_name,
        COALESCE(gm.slug, LOWER(REPLACE(gm.name, ' ', '-'))) as gpu_model_slug,
        gm.vram as gpu_model_vram,
        COALESCE(gm.manufacturer::TEXT, 'NVIDIA') as manufacturer
    FROM prices p
    JOIN providers pr ON p.provider_id = pr.id
    JOIN gpu_models gm ON p.gpu_model_id = gm.id
    WHERE 
        (selected_provider IS NULL OR p.provider_id = selected_provider)
        AND (selected_gpu IS NULL OR p.gpu_model_id = selected_gpu)
    ORDER BY p.provider_id, p.gpu_model_id, p.created_at DESC;
END;
$$;