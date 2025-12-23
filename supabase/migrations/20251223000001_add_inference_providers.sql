-- Migration: Add inference API providers
-- Inserts new inference-only providers and updates existing dual providers

-- Insert new inference-only providers
INSERT INTO providers (id, name, slug, website, pricing_page, type) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'OpenAI', 'openai', 'https://openai.com', 'https://openai.com/api/pricing', 'inference_api'),
('b2c3d4e5-f6a7-8901-bcde-f23456789012', 'Anthropic', 'anthropic', 'https://www.anthropic.com', 'https://www.anthropic.com/pricing', 'inference_api'),
('c3d4e5f6-a7b8-9012-cdef-345678901234', 'Together AI', 'together-ai', 'https://www.together.ai', 'https://www.together.ai/pricing', 'inference_api'),
('d4e5f6a7-b8c9-0123-defa-456789012345', 'Fireworks AI', 'fireworks-ai', 'https://fireworks.ai', 'https://fireworks.ai/pricing', 'inference_api')
ON CONFLICT (name) DO UPDATE SET
    slug = EXCLUDED.slug,
    website = EXCLUDED.website,
    pricing_page = EXCLUDED.pricing_page,
    type = EXCLUDED.type;
