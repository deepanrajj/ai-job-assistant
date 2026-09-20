-- create the notes table: notes belonging to a saved job
CREATE TABLE notes (
    id UUID PRIMARY KEY,
    -- cascades on delete, so removing a job removes its notes
    job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- supports lookups by job, and the cascade delete above
CREATE INDEX idx_notes_job_id ON notes (job_id);
