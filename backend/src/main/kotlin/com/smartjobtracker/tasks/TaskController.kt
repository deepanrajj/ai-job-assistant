package com.smartjobtracker.tasks

import com.smartjobtracker.api.error.ApiErrorResponse
import com.smartjobtracker.tasks.dto.CreateTaskRequest
import com.smartjobtracker.tasks.dto.TaskResponse
import com.smartjobtracker.tasks.dto.UpdateTaskRequest
import com.smartjobtracker.tasks.dto.toCommand
import com.smartjobtracker.tasks.dto.toResponse
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

private const val TASK_NOT_FOUND_DESCRIPTION = "Job or task not found"

private const val VALIDATION_FAILED_DESCRIPTION = "Request validation failed"

@RestController
@RequestMapping("/jobs/{jobId}/tasks")
class TaskController(
    private val taskService: TaskService,
) {
    @GetMapping
    @ApiResponse(
        responseCode = "404",
        description = TASK_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun listTasks(
        @PathVariable jobId: UUID,
    ): List<TaskResponse> = taskService.listTasks(jobId).map { it.toResponse() }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(
        responseCode = "400",
        description = VALIDATION_FAILED_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun createTask(
        @PathVariable jobId: UUID,
        @Valid @RequestBody request: CreateTaskRequest,
    ): TaskResponse = taskService.createTask(jobId, request.toCommand()).toResponse()

    @PutMapping("/{taskId}")
    @ApiResponse(
        responseCode = "400",
        description = VALIDATION_FAILED_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    @ApiResponse(
        responseCode = "404",
        description = TASK_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun updateTask(
        @PathVariable jobId: UUID,
        @PathVariable taskId: UUID,
        @Valid @RequestBody request: UpdateTaskRequest,
    ): TaskResponse = taskService.updateTask(jobId = jobId, taskId = taskId, command = request.toCommand()).toResponse()

    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(
        responseCode = "404",
        description = TASK_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun deleteTask(
        @PathVariable jobId: UUID,
        @PathVariable taskId: UUID,
    ) {
        taskService.deleteTask(jobId = jobId, taskId = taskId)
    }
}
