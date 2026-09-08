package com.smartjobtracker.tasks

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(name = "tasks")
class Task(
    @Id
    val id: UUID,
    @Column(name = "job_id", nullable = false)
    val jobId: UUID,
    @Column(nullable = false)
    val title: String,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: TaskStatus,
    @Column(name = "due_date")
    val dueDate: LocalDate?,
    @Column(name = "created_at", nullable = false)
    val createdAt: OffsetDateTime,
    @Column(name = "updated_at", nullable = false)
    val updatedAt: OffsetDateTime,
)

enum class TaskStatus {
    TODO,
    DONE,
}
