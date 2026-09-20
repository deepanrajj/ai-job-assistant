package com.smartjobtracker.notes

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface NoteRepository : JpaRepository<Note, UUID> {
    /**
     * Notes for one job, oldest first. `id` breaks ties so the order is
     * total: notes created in the same instant, which a fixed test clock
     * guarantees, would otherwise come back in whatever order the
     * database chose.
     */
    fun findAllByJobIdOrderByCreatedAtAscIdAsc(jobId: UUID): List<Note>
}
