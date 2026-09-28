-- create the contacts table: contacts belonging to a saved job
CREATE TABLE contacts (
    id UUID PRIMARY KEY,
    -- cascades on delete, so removing a job removes its contacts
    job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    profile_url VARCHAR(2048),
    last_contacted_at DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- supports lookups by job, and the cascade delete above
CREATE INDEX idx_contacts_job_id ON contacts (job_id);
