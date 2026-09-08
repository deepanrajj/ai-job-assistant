-- create the tasks table: preparation tasks belonging to a saved job
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    -- cascades on delete, so removing a job removes its tasks
    job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- supports lookups by job, and the cascade delete above
CREATE INDEX idx_tasks_job_id ON tasks (job_id);
