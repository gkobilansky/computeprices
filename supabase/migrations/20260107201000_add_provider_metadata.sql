-- Add metadata columns to providers table for syncing from individual JSON files
-- This allows storing rich provider data from data/providers/*.json in the database

-- Core descriptive fields
ALTER TABLE providers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS docs_link TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS hq_country TEXT;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Flexible metadata stored as JSONB for schema-less attributes
-- Includes: features, pros, cons, gettingStarted, computeServices, gpuServices, pricingOptions
ALTER TABLE providers ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add index on category for filtering
CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category);

-- Add index on metadata for JSONB queries
CREATE INDEX IF NOT EXISTS idx_providers_metadata ON providers USING GIN (metadata);

-- Comment on the new columns
COMMENT ON COLUMN providers.description IS 'Brief description of the provider';
COMMENT ON COLUMN providers.docs_link IS 'URL to provider documentation';
COMMENT ON COLUMN providers.category IS 'Provider category: Classical hyperscaler, Massive neocloud, etc.';
COMMENT ON COLUMN providers.tagline IS 'Short marketing tagline';
COMMENT ON COLUMN providers.hq_country IS 'Country code of headquarters (e.g., US, DE)';
COMMENT ON COLUMN providers.tags IS 'Additional tags like Budget, Green, Decentralized';
COMMENT ON COLUMN providers.metadata IS 'Flexible JSONB field for features, pros, cons, services, etc.';
