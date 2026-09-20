package com.smartjobtracker.notes

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface NoteRepository : JpaRepository<Note, UUID> {
    fun findAllByJobIdOrderByCreatedAtAscIdAsc(jobId: UUID): List<Note>
}
