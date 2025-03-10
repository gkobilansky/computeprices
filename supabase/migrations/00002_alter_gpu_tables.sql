-- Create manufacturer enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE gpu_manufacturer AS ENUM ('NVIDIA', 'AMD', 'Intel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add new columns to gpu_models table
ALTER TABLE gpu_models
    ADD COLUMN IF NOT EXISTS manufacturer gpu_manufacturer,
    ADD COLUMN IF NOT EXISTS architecture VARCHAR(255),
    ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
    ADD COLUMN IF NOT EXISTS use_case TEXT;

-- Add unique constraint to slug if it doesn't exist
DO $$ BEGIN
    ALTER TABLE gpu_models ADD CONSTRAINT gpu_models_slug_key UNIQUE (slug);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_gpu_models_name ON gpu_models(name);
CREATE INDEX IF NOT EXISTS idx_gpu_models_manufacturer ON gpu_models(manufacturer);
CREATE INDEX IF NOT EXISTS idx_gpu_models_slug ON gpu_models(slug);

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
CREATE POLICY IF NOT EXISTS "Allow public read access to gpu_details"
    ON gpu_details FOR SELECT
    USING (true);

CREATE POLICY IF NOT EXISTS "Allow authenticated insert to gpu_details"
    ON gpu_details FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Update existing rows to populate manufacturer (if needed)
UPDATE gpu_models 
SET manufacturer = 'NVIDIA'::gpu_manufacturer,
    slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '/', '-'))
WHERE manufacturer IS NULL;

-- Make manufacturer NOT NULL after populating data
ALTER TABLE gpu_models 
    ALTER COLUMN manufacturer SET NOT NULL,
    ALTER COLUMN slug SET NOT NULL; 