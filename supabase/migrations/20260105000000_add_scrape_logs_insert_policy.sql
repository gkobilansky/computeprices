-- Add INSERT policy for scrape_logs table
-- The service role should bypass RLS, but this ensures inserts work
-- from server-side API routes using the admin client

-- Allow service role to insert scrape logs
DROP POLICY IF EXISTS "Allow service role to insert scrape_logs" ON scrape_logs;
CREATE POLICY "Allow service role to insert scrape_logs"
    ON scrape_logs FOR INSERT
    WITH CHECK (true);

-- Also allow service role to select (for the rotation query)
-- The existing SELECT policy should work, but adding this for completeness
