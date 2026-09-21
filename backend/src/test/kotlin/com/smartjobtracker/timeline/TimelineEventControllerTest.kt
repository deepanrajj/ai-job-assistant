package com.smartjobtracker.timeline

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.api.error.ApiExceptionHandler
import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.testsupport.timeline.FakeTimelineEventService
import com.smartjobtracker.testsupport.timeline.createTimelineEventEntity
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.http.HttpStatus
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import java.util.UUID

class TimelineEventControllerTest {
    private lateinit var timelineEventService: FakeTimelineEventService
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        timelineEventService = FakeTimelineEventService()
        mockMvc =
            MockMvcBuilders
                .standaloneSetup(TimelineEventController(timelineEventService))
                .setControllerAdvice(ApiExceptionHandler())
                .build()
    }

    @Test
    fun `lists a job's timeline events`() {
        val jobId = UUID.randomUUID()
        val event =
            createTimelineEventEntity(
                jobId = jobId,
                previousStatus = JobStatus.WISHLIST,
                nextStatus = JobStatus.APPLIED,
            )
        timelineEventService.listHandler = { listOf(event) }

        mockMvc
            .perform(get("/jobs/{jobId}/timeline", jobId))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(event.id.toString()))
            .andExpect(jsonPath("$[0].jobId").value(jobId.toString()))
            .andExpect(jsonPath("$[0].previousStatus").value("WISHLIST"))
            .andExpect(jsonPath("$[0].nextStatus").value("APPLIED"))

        assertThat(timelineEventService.lastListedJobId).isEqualTo(jobId)
    }

    @Test
    fun `returns job not found when the service reports a missing job`() {
        timelineEventService.listHandler = {
            throw ApiException(
                status = HttpStatus.NOT_FOUND,
                errorCode = ApiErrorCode.JOB_NOT_FOUND,
                message = "Job not found.",
            )
        }

        mockMvc
            .perform(get("/jobs/{jobId}/timeline", UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
    }

    @Test
    fun `returns bad request when the job id path segment is not a uuid`() {
        mockMvc
            .perform(get("/jobs/{jobId}/timeline", "not-a-uuid"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.INVALID_REQUEST_PARAMETER.value))
    }

    @Test
    fun `lists all timeline events paginated with default paging`() {
        val event = createTimelineEventEntity(jobId = UUID.randomUUID())
        timelineEventService.listAllHandler = { page, size ->
            PageImpl(listOf(event), PageRequest.of(page, size), 1)
        }

        mockMvc
            .perform(get("/timeline-events"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content[0].id").value(event.id.toString()))
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.size").value(20))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.totalPages").value(1))

        assertThat(timelineEventService.lastListAllPage).isEqualTo(0)
        assertThat(timelineEventService.lastListAllSize).isEqualTo(20)
    }

    @Test
    fun `lists all timeline events paginated with explicit paging`() {
        val event = createTimelineEventEntity(jobId = UUID.randomUUID())
        timelineEventService.listAllHandler = { page, size ->
            PageImpl(listOf(event), PageRequest.of(page, size), 30)
        }

        mockMvc
            .perform(get("/timeline-events").param("page", "1").param("size", "10"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.totalElements").value(30))

        assertThat(timelineEventService.lastListAllPage).isEqualTo(1)
        assertThat(timelineEventService.lastListAllSize).isEqualTo(10)
    }
}
