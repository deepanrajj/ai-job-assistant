package com.smartjobtracker.tasks.dto

import com.smartjobtracker.tasks.Task
import com.smartjobtracker.tasks.TaskStatus
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Public API representation of a saved task. Deliberately omits
 * `jobId`: every route already carries it in the path, so repeating it
 * in the body would be redundant.
 */
data class TaskResponse(
    val id: UUID,
    val title: String,
    val status: TaskStatus,
    val dueDate: LocalDate?,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)

fun Task.toResponse(): TaskResponse =
    TaskResponse(
        id = id,
        title = title,
        status = status,
        dueDate = dueDate,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )
