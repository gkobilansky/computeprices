-- Create scrape_logs table for tracking Firecrawl and fallback scraper results
CREATE TABLE IF NOT EXISTS scrape_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    provider_name TEXT NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('firecrawl', 'fallback', 'api')),
    success BOOLEAN NOT NULL DEFAULT false,
    matched_count INTEGER NOT NULL DEFAULT 0,
    unmatched_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scrape_logs_provider_id ON scrape_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_created_at ON scrape_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_method ON scrape_logs(method);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_success ON scrape_logs(success);

-- Enable Row Level Security
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for monitoring dashboards)
DROP POLICY IF EXISTS "Allow public read access to scrape_logs" ON scrape_logs;
CREATE POLICY "Allow public read access to scrape_logs"
    ON scrape_logs FOR SELECT
    USING (true);

-- Add comment describing the table purpose
COMMENT ON TABLE scrape_logs IS 'Tracks results of pricing page scraping attempts via Firecrawl, fallback scrapers, and APIs';
COMMENT ON COLUMN scrape_logs.method IS 'The scraping method used: firecrawl, fallback (browserless), or api';
COMMENT ON COLUMN scrape_logs.matched_count IS 'Number of GPU prices successfully matched to existing GPU models';
COMMENT ON COLUMN scrape_logs.unmatched_count IS 'Number of GPU prices that could not be matched to existing models';
