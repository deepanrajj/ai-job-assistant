package com.smartjobtracker.timeline

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.jobs.JobService
import com.smartjobtracker.testsupport.api.assertApiException
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.timeline.createTimelineEventEntity
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.catchThrowableOfType
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@SpringBootTest
@Transactional
class TimelineEventServiceTest {
    @Autowired
    lateinit var timelineEventRepository: TimelineEventRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var jobService: JobService

    private lateinit var timelineEventService: TimelineEventService

    @BeforeEach
    fun setUp() {
        timelineEventService = DefaultTimelineEventService(timelineEventRepository, jobService)
    }

    private fun seedJob(): UUID = jobRepository.save(createJobEntity()).id

    private fun seedEvent(
        jobId: UUID,
        createdAt: OffsetDateTime,
    ) = timelineEventRepository.save(createTimelineEventEntity(jobId = jobId, createdAt = createdAt))

    @Test
    fun `lists a job's timeline events in creation order`() {
        val jobId = seedJob()
        val base = OffsetDateTime.parse("2026-07-05T12:00:00Z")
        val older = seedEvent(jobId, base.minusDays(2))
        val newer = seedEvent(jobId, base.minusDays(1))
        seedEvent(seedJob(), base)

        val events = timelineEventService.listTimelineEvents(jobId)

        assertThat(events.map { it.id }).containsExactly(older.id, newer.id)
    }

    @Test
    fun `throws job not found when listing timeline events for a missing job`() {
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                timelineEventService.listTimelineEvents(UUID.randomUUID())
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `lists events across jobs paginated, oldest first`() {
        val base = OffsetDateTime.parse("2026-07-05T12:00:00Z")
        val first = seedEvent(seedJob(), base.minusDays(3))
        val second = seedEvent(seedJob(), base.minusDays(2))
        val third = seedEvent(seedJob(), base.minusDays(1))

        val firstPage = timelineEventService.listAllTimelineEvents(page = 0, size = 2)
        val secondPage = timelineEventService.listAllTimelineEvents(page = 1, size = 2)

        assertThat(firstPage.content.map { it.id }).containsExactly(first.id, second.id)
        assertThat(secondPage.content.map { it.id }).containsExactly(third.id)
        assertThat(firstPage.totalElements).isEqualTo(3)
        assertThat(firstPage.totalPages).isEqualTo(2)
    }

    @Test
    fun `clamps a negative page number to zero`() {
        val jobId = seedJob()
        val event = seedEvent(jobId, OffsetDateTime.parse("2026-07-05T12:00:00Z"))

        val page = timelineEventService.listAllTimelineEvents(page = -5, size = 10)

        assertThat(page.number).isZero()
        assertThat(page.content.map { it.id }).containsExactly(event.id)
    }

    @Test
    fun `clamps an out-of-range page size`() {
        val jobId = seedJob()
        seedEvent(jobId, OffsetDateTime.parse("2026-07-05T12:00:00Z"))

        val tooSmall = timelineEventService.listAllTimelineEvents(page = 0, size = 0)
        val tooLarge = timelineEventService.listAllTimelineEvents(page = 0, size = 10_000)

        assertThat(tooSmall.size).isEqualTo(1)
        assertThat(tooLarge.size).isEqualTo(100)
    }
}
