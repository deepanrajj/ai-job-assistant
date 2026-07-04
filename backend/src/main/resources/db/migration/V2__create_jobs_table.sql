-- create the jobs table: first persisted tracker domain model (saved jobs)
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    user_id UUID,
    company VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    job_url VARCHAR(2048),
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
