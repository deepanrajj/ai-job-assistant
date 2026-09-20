package com.smartjobtracker.jobs

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface JobRepository : JpaRepository<Job, UUID> {
    /**
     * All jobs, most recently updated first. `id` breaks ties so the
     * order is total: jobs updated in the same instant, which a fixed
     * test clock guarantees, would otherwise come back in whatever
     * order the database chose.
     */
    fun findAllByOrderByUpdatedAtDescIdAsc(): List<Job>
}
