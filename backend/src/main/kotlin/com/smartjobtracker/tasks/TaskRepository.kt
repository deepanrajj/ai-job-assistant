package com.smartjobtracker.tasks

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TaskRepository : JpaRepository<Task, UUID> {
    /**
     * Tasks for one job, oldest first. `id` breaks ties so the order is
     * total: tasks created in the same instant, which a fixed test clock
     * guarantees, would otherwise come back in whatever order the
     * database chose.
     */
    fun findAllByJobIdOrderByCreatedAtAscIdAsc(jobId: UUID): List<Task>

    /**
     * One task, only if it belongs to the given job. A task that exists
     * under a different job comes back `null`, so callers report it as
     * not found instead of reaching across jobs.
     */
    fun findByIdAndJobId(
        id: UUID,
        jobId: UUID,
    ): Task?
}
