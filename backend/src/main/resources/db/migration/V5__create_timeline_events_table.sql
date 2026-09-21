-- create the timeline_events table: append-only history of what
-- happened to a saved job
CREATE TABLE timeline_events (
    id UUID PRIMARY KEY,
    -- cascades on delete, so removing a job removes its timeline
    job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    previous_status VARCHAR(50),
    next_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- supports lookups by job, and the cascade delete above
CREATE INDEX idx_timeline_events_job_id ON timeline_events (job_id);
