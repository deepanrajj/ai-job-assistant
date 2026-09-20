package com.smartjobtracker.notes

import com.smartjobtracker.persistence.AssignedIdEntity
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

/**
 * `body` and `updatedAt` are `var` so an update mutates the managed
 * instance and lets Hibernate's dirty checking write it; it must not
 * rebuild the entity. See [AssignedIdEntity]. `jobId` and `createdAt`
 * stay `val` because nothing moves a note to another job or rewrites
 * when it was created.
 */
@Entity
@Table(name = "notes")
class Note(
    id: UUID,
    @Column(name = "job_id", nullable = false)
    val jobId: UUID,
    @Column(nullable = false)
    var body: String,
    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime,
    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime,
) : AssignedIdEntity(id)
