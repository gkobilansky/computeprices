-- Migration: Add inference API schema for LLM pricing
-- This adds support for pay-per-token LLM API providers alongside GPU compute pricing

-- Add provider type enum
DO $$ BEGIN
    CREATE TYPE provider_type AS ENUM ('gpu_compute', 'inference_api', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add type column to providers (default to gpu_compute for existing)
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS type provider_type DEFAULT 'gpu_compute';

-- Update existing dual providers (DeepInfra and Hyperstack offer both GPU and inference)
UPDATE providers SET type = 'both' WHERE slug IN ('deep-infra', 'hyperstack');

-- Create llm_models table
CREATE TABLE IF NOT EXISTS llm_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                          -- e.g., "GPT-4o", "Claude 3.5 Sonnet"
    slug TEXT NOT NULL UNIQUE,                   -- e.g., "gpt-4o", "claude-3-5-sonnet"
    creator TEXT NOT NULL,                       -- e.g., "OpenAI", "Anthropic", "Meta"
    context_window INTEGER,                      -- Max tokens (e.g., 128000, 200000)
    description TEXT,                            -- Brief description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for llm_models
CREATE INDEX IF NOT EXISTS idx_llm_models_slug ON llm_models(slug);
CREATE INDEX IF NOT EXISTS idx_llm_models_creator ON llm_models(creator);

-- Create llm_prices table
CREATE TABLE IF NOT EXISTS llm_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    llm_model_id UUID NOT NULL REFERENCES llm_models(id) ON DELETE CASCADE,
    price_per_1m_input DECIMAL(10,4) NOT NULL,   -- Price per 1M input tokens
    price_per_1m_output DECIMAL(10,4) NOT NULL,  -- Price per 1M output tokens
    source_url TEXT,                              -- Where price was found
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for llm_prices
CREATE INDEX IF NOT EXISTS idx_llm_prices_provider_id ON llm_prices(provider_id);
CREATE INDEX IF NOT EXISTS idx_llm_prices_llm_model_id ON llm_prices(llm_model_id);
CREATE INDEX IF NOT EXISTS idx_llm_prices_created_at ON llm_prices(created_at);

-- Enable RLS on new tables
ALTER TABLE llm_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_prices ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Allow public read access to llm_models" ON llm_models;
CREATE POLICY "Allow public read access to llm_models"
    ON llm_models FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read access to llm_prices" ON llm_prices;
CREATE POLICY "Allow public read access to llm_prices"
    ON llm_prices FOR SELECT USING (true);

-- Stored procedure for latest LLM prices
CREATE OR REPLACE FUNCTION get_latest_llm_prices(
    selected_provider UUID DEFAULT NULL,
    selected_model UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    provider_id UUID,
    provider_name TEXT,
    provider_slug TEXT,
    llm_model_id UUID,
    model_name TEXT,
    model_slug TEXT,
    creator TEXT,
    context_window INTEGER,
    price_per_1m_input DECIMAL,
    price_per_1m_output DECIMAL,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (lp.provider_id, lp.llm_model_id)
        lp.id,
        lp.provider_id,
        p.name as provider_name,
        p.slug as provider_slug,
        lp.llm_model_id,
        lm.name as model_name,
        lm.slug as model_slug,
        lm.creator,
        lm.context_window,
        lp.price_per_1m_input,
        lp.price_per_1m_output,
        lp.source_url,
        lp.created_at
    FROM llm_prices lp
    JOIN providers p ON lp.provider_id = p.id
    JOIN llm_models lm ON lp.llm_model_id = lm.id
    WHERE
        (selected_provider IS NULL OR lp.provider_id = selected_provider)
        AND (selected_model IS NULL OR lp.llm_model_id = selected_model)
    ORDER BY lp.provider_id, lp.llm_model_id, lp.created_at DESC;
END;
$$;
