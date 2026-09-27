package com.smartjobtracker.contacts

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ContactRepository : JpaRepository<Contact, UUID> {
    /**
     * Contacts for one job, oldest first. `id` breaks ties so the order
     * is total: contacts created in the same instant, which a fixed test
     * clock guarantees, would otherwise come back in whatever order the
     * database chose.
     */
    fun findAllByJobIdOrderByCreatedAtAscIdAsc(jobId: UUID): List<Contact>

    /**
     * One contact, only if it belongs to the given job. A contact that
     * exists under a different job comes back `null`, so callers report
     * it as not found instead of reaching across jobs.
     */
    fun findByIdAndJobId(
        id: UUID,
        jobId: UUID,
    ): Contact?
}
