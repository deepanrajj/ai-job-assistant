package com.smartjobtracker.timeline

import com.smartjobtracker.api.PagedResponse
import com.smartjobtracker.api.error.ApiErrorResponse
import com.smartjobtracker.timeline.dto.TimelineEventResponse
import com.smartjobtracker.timeline.dto.toResponse
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

private const val JOB_NOT_FOUND_DESCRIPTION = "Job not found"

@RestController
class TimelineEventController(
    private val timelineEventService: TimelineEventService,
) {
    @GetMapping("/jobs/{jobId}/timeline")
    @ApiResponse(
        responseCode = "404",
        description = JOB_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun listTimelineEvents(
        @PathVariable jobId: UUID,
    ): List<TimelineEventResponse> = timelineEventService.listTimelineEvents(jobId).map { it.toResponse() }

    /**
     * `size` defaults to `20` for a caller that omits it. The service
     * clamps whatever value arrives here, so a mismatch between this
     * default and the service's own bounds cannot produce an unbounded
     * response either way.
     */
    @GetMapping("/timeline-events")
    fun listAllTimelineEvents(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): PagedResponse<TimelineEventResponse> {
        val result = timelineEventService.listAllTimelineEvents(page, size)

        return PagedResponse(
            content = result.content.map { it.toResponse() },
            page = result.number,
            size = result.size,
            totalElements = result.totalElements,
            totalPages = result.totalPages,
        )
    }
}
