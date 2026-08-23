package com.smartjobtracker.jobs

import com.smartjobtracker.api.error.ApiErrorResponse
import com.smartjobtracker.jobs.dto.CreateJobRequest
import com.smartjobtracker.jobs.dto.JobResponse
import com.smartjobtracker.jobs.dto.UpdateJobRequest
import com.smartjobtracker.jobs.dto.toCommand
import com.smartjobtracker.jobs.dto.toResponse
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

private const val JOB_NOT_FOUND_DESCRIPTION = "Job not found"

private const val VALIDATION_FAILED_DESCRIPTION = "Request validation failed"

@RestController
@RequestMapping("/jobs")
class JobController(
    private val jobService: JobService,
) {
    @GetMapping
    fun listJobs(): List<JobResponse> = jobService.listJobs().map { it.toResponse() }

    @GetMapping("/{id}")
    @ApiResponse(
        responseCode = "404",
        description = JOB_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun getJob(
        @PathVariable id: UUID,
    ): JobResponse = jobService.getJob(id).toResponse()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(
        responseCode = "400",
        description = VALIDATION_FAILED_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun createJob(
        @Valid @RequestBody request: CreateJobRequest,
    ): JobResponse = jobService.createJob(request.toCommand()).toResponse()

    @PutMapping("/{id}")
    @ApiResponse(
        responseCode = "400",
        description = VALIDATION_FAILED_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    @ApiResponse(
        responseCode = "404",
        description = JOB_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun updateJob(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateJobRequest,
    ): JobResponse = jobService.updateJob(id, request.toCommand()).toResponse()

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(
        responseCode = "404",
        description = JOB_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun deleteJob(
        @PathVariable id: UUID,
    ) {
        jobService.deleteJob(id)
    }
}
