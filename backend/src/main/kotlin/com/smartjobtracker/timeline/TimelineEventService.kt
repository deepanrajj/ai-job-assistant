package com.smartjobtracker.timeline

import com.smartjobtracker.jobs.JobService
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

private const val MAX_PAGE_SIZE = 100
private const val MIN_PAGE_NUMBER = 0
private const val MIN_PAGE_SIZE = 1

interface TimelineEventService {
    fun listTimelineEvents(jobId: UUID): List<TimelineEvent>

    fun listAllTimelineEvents(
        page: Int,
        size: Int,
    ): Page<TimelineEvent>
}

@Service
class DefaultTimelineEventService(
    private val timelineEventRepository: TimelineEventRepository,
    private val jobService: JobService,
) : TimelineEventService {
    @Transactional
    override fun listTimelineEvents(jobId: UUID): List<TimelineEvent> {
        jobService.getJob(jobId)

        return timelineEventRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId)
    }

    @Transactional
    override fun listAllTimelineEvents(
        page: Int,
        size: Int,
    ): Page<TimelineEvent> {
        val clampedPage = page.coerceAtLeast(MIN_PAGE_NUMBER)
        val clampedSize = size.coerceIn(MIN_PAGE_SIZE, MAX_PAGE_SIZE)

        return timelineEventRepository.findAllByOrderByCreatedAtAscIdAsc(PageRequest.of(clampedPage, clampedSize))
    }
}
