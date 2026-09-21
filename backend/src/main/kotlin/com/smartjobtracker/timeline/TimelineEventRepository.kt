package com.smartjobtracker.timeline

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TimelineEventRepository : JpaRepository<TimelineEvent, UUID> {
    /**
     * A job's events, oldest first. `id` breaks ties so the order is
     * total: events created in the same instant, which a fixed test
     * clock guarantees, would otherwise come back in whatever order the
     * database chose.
     */
    fun findAllByJobIdOrderByCreatedAtAscIdAsc(jobId: UUID): List<TimelineEvent>

    /**
     * Every event across every job, oldest first, paginated. `pageable`
     * only supplies the page offset/limit; the method name's ordering
     * always wins, so callers cannot request a different sort.
     */
    fun findAllByOrderByCreatedAtAscIdAsc(pageable: Pageable): Page<TimelineEvent>
}
