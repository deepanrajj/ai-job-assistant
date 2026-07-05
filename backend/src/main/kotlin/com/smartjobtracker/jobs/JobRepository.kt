package com.smartjobtracker.jobs

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface JobRepository : JpaRepository<Job, UUID> {
    fun findAllByOrderByUpdatedAtDesc(): List<Job>
}
