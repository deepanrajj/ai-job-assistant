package com.smartjobtracker.tasks.dto

import com.smartjobtracker.tasks.TaskStatus
import com.smartjobtracker.tasks.command.CreateTaskCommand
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.LocalDate

data class CreateTaskRequest(
    @field:NotBlank(message = "Title must not be blank")
    @field:Size(max = MAX_TITLE_LENGTH, message = "Title must be at most 255 characters")
    val title: String,
    val status: TaskStatus? = null,
    val dueDate: LocalDate? = null,
)

fun CreateTaskRequest.toCommand(): CreateTaskCommand {
    val command =
        CreateTaskCommand(
            title = title,
            dueDate = dueDate,
        )

    return if (status == null) command else command.copy(status = status)
}
