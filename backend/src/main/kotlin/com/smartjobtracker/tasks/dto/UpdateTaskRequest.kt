package com.smartjobtracker.tasks.dto

import com.smartjobtracker.tasks.TaskStatus
import com.smartjobtracker.tasks.command.UpdateTaskCommand
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class UpdateTaskRequest(
    @field:NotBlank(message = "Title must not be blank")
    @field:Size(max = MAX_TITLE_LENGTH, message = "Title must be at most 255 characters")
    val title: String,
    @field:NotNull(message = "Status must not be null")
    val status: TaskStatus?,
    val dueDate: LocalDate?,
)

fun UpdateTaskRequest.toCommand(): UpdateTaskCommand =
    UpdateTaskCommand(
        title = title,
        status = requireNotNull(status) { "Status must not be null" },
        dueDate = dueDate,
    )
