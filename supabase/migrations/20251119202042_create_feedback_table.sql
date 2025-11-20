-- Collect lightweight thumbs up/down feedback with optional details and email
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reaction TEXT CHECK (reaction IN ('up', 'down')),
    details TEXT,
    email TEXT,
    page VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_reaction ON feedback (reaction);

-- Lock down feedback by default; service role inserts via API route
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
