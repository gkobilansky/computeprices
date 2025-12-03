-- Align local schema with production (excluding data) while keeping RLS policies.

-- 1) Match providers/gpu_models UUID defaults to prod (uuid_generate_v4).
ALTER TABLE providers
    ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4(),
    ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

ALTER TABLE gpu_models
    ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4(),
    ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- 2) prices adjustments: match default timezone and numeric gpu_count type.
ALTER TABLE prices
    ALTER COLUMN created_at SET DEFAULT (now() AT TIME ZONE 'est'),
    ALTER COLUMN gpu_count TYPE numeric USING gpu_count::numeric;

-- 3) Add role enum and alter users.role to enum with comment (prod parity).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE role AS ENUM ('user', 'admin');
        COMMENT ON TYPE role IS 'user roles';
    END IF;
END$$;

ALTER TABLE users
    ALTER COLUMN role DROP DEFAULT,
    ALTER COLUMN role TYPE role USING role::role,
    ALTER COLUMN role SET DEFAULT 'user';
COMMENT ON COLUMN users.role IS 'user role';

-- 4) Replace get_latest_prices to match prod signature/return set.
-- Drop old definition first to allow return-type change.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'get_latest_prices'
    ) THEN
        DROP FUNCTION get_latest_prices(UUID, UUID);
    END IF;
END;
$$;

CREATE FUNCTION get_latest_prices(
    selected_provider UUID DEFAULT NULL,
    selected_gpu UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    provider_id UUID,
    provider_name TEXT,
    provider_slug TEXT,
    gpu_model_id UUID,
    gpu_model_name TEXT,
    gpu_model_vram INTEGER,
    price_per_hour NUMERIC,
    gpu_count NUMERIC,
    source_name TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (p.provider_id, p.gpu_model_id)
    p.id,
    p.provider_id,
    prov.name AS provider_name,
    prov.slug AS provider_slug,
    p.gpu_model_id,
    gm.name AS gpu_model_name,
    gm.vram AS gpu_model_vram,
    p.price_per_hour,
    p.gpu_count,
    p.source_name,
    p.source_url,
    p.created_at
  FROM prices p
  JOIN providers prov ON p.provider_id = prov.id
  JOIN gpu_models gm ON p.gpu_model_id = gm.id
  WHERE (selected_provider IS NULL OR p.provider_id = selected_provider)
    AND (selected_gpu IS NULL OR p.gpu_model_id = selected_gpu)
  ORDER BY p.provider_id, p.gpu_model_id, p.created_at DESC;
END;
$$;

-- 5) Add get_latest_gpu_price for parity.
CREATE OR REPLACE FUNCTION get_latest_gpu_price(p_provider_id uuid, p_gpu_model_id uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN (
        SELECT price_per_hour
        FROM prices
        WHERE provider_id = p_provider_id
          AND gpu_model_id = p_gpu_model_id
        ORDER BY created_at DESC
        LIMIT 1
    );
END;
$$;
