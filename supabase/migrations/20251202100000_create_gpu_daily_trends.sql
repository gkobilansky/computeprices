-- RPC to return daily average price trends for a GPU across providers.
-- Uses the latest price per provider per day, then averages across providers.
CREATE OR REPLACE FUNCTION get_gpu_daily_trends(
    selected_gpu UUID,
    days INTEGER DEFAULT 30
)
RETURNS TABLE (
    day DATE,
    gpu_model_id UUID,
    avg_price_per_hour NUMERIC,
    provider_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF selected_gpu IS NULL THEN
        RAISE EXCEPTION 'selected_gpu is required';
    END IF;

    RETURN QUERY
    WITH daily AS (
        SELECT DISTINCT ON (p.provider_id, date(p.created_at))
            date(p.created_at) AS day,
            p.provider_id,
            p.gpu_model_id,
            p.price_per_hour
        FROM prices p
        WHERE p.gpu_model_id = selected_gpu
          AND p.created_at >= (now() - make_interval(days => GREATEST(days, 1)))
        ORDER BY p.provider_id, date(p.created_at), p.created_at DESC
    )
    SELECT
        d.day,
        d.gpu_model_id,
        AVG(d.price_per_hour) AS avg_price_per_hour,
        COUNT(DISTINCT d.provider_id) AS provider_count
    FROM daily d
    GROUP BY d.day, d.gpu_model_id
    ORDER BY d.day ASC;
END;
$$;
