-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_gpu_models_name ON gpu_models(name);
CREATE INDEX IF NOT EXISTS idx_gpu_models_manufacturer ON gpu_models(manufacturer);
CREATE INDEX IF NOT EXISTS idx_gpu_models_slug ON gpu_models(slug);

-- Add unique constraint to slug if it doesn't exist
DO $$ BEGIN
    ALTER TABLE gpu_models ADD CONSTRAINT gpu_models_slug_key UNIQUE (slug);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create gpu_details table
CREATE TABLE IF NOT EXISTS gpu_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gpu_model_id UUID NOT NULL REFERENCES gpu_models(id) ON DELETE CASCADE,
    cuda_cores INTEGER,
    tensor_cores INTEGER,
    base_clock_mhz INTEGER,
    boost_clock_mhz INTEGER,
    memory_type VARCHAR(50),
    memory_bandwidth_gbps DECIMAL(10,2),
    power_watts INTEGER,
    interface VARCHAR(50),
    extra_specs JSONB,
    CONSTRAINT unique_gpu_model UNIQUE (gpu_model_id)
);

-- Enable RLS on gpu_details
ALTER TABLE gpu_details ENABLE ROW LEVEL SECURITY;

-- Create policies for gpu_details
DROP POLICY IF EXISTS "Allow public read access to gpu_details" ON gpu_details;
CREATE POLICY "Allow public read access to gpu_details"
    ON gpu_details FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to gpu_details" ON gpu_details;
CREATE POLICY "Allow authenticated insert to gpu_details"
    ON gpu_details FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Data will be populated via seed.sql, so no need to update existing rows 