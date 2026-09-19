package com.smartjobtracker.tasks.command

import com.smartjobtracker.tasks.TaskStatus
import java.time.LocalDate

data class CreateTaskCommand(
    val title: String,
    val status: TaskStatus = TaskStatus.TODO,
    val dueDate: LocalDate? = null,
)

data class UpdateTaskCommand(
    val title: String,
    val status: TaskStatus,
    val dueDate: LocalDate?,
)
