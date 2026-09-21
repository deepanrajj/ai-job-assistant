package com.smartjobtracker.timeline

import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.jobs.JobStatus
import com.smartjobtracker.testsupport.jobs.createJobEntity
import org.assertj.core.api.Assertions.assertThat
import org.hamcrest.Matchers.hasSize
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

/**
 * End-to-end coverage of the timeline read routes against the real
 * application context, driving status changes through the real
 * `JobController` so the events under test are the product of the
 * actual write path (`DefaultJobService.updateJob`), not hand-seeded
 * rows.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TimelineEventCrudIntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var jobRepository: JobRepository

    private fun seedJob(status: JobStatus = JobStatus.WISHLIST): UUID {
        val job = createJobEntity(status = status)

        return jobRepository.save(job).id
    }

    private fun updateJobStatus(
        jobId: UUID,
        status: JobStatus,
    ) {
        val job = jobRepository.findById(jobId).orElseThrow()
        mockMvc
            .perform(
                put("/jobs/{id}", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "company": "${job.company}",
                          "roleTitle": "${job.roleTitle}",
                          "status": "$status"
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isOk)
    }

    @Test
    fun `records and reads a timeline event through the real job update path`() {
        val jobId = seedJob()

        updateJobStatus(jobId, JobStatus.APPLIED)

        mockMvc
            .perform(get("/jobs/{jobId}/timeline", jobId))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$", hasSize<Any>(1)))
            .andExpect(jsonPath("$[0].jobId").value(jobId.toString()))
            .andExpect(jsonPath("$[0].type").value("STATUS_CHANGE"))
            .andExpect(jsonPath("$[0].previousStatus").value("WISHLIST"))
            .andExpect(jsonPath("$[0].nextStatus").value("APPLIED"))
    }

    @Test
    fun `returns job not found when reading the timeline of a missing job`() {
        mockMvc
            .perform(get("/jobs/{jobId}/timeline", UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
    }

    @Test
    fun `lists a job's events in creation order`() {
        val jobId = seedJob()

        updateJobStatus(jobId, JobStatus.APPLIED)
        updateJobStatus(jobId, JobStatus.INTERVIEW)

        mockMvc
            .perform(get("/jobs/{jobId}/timeline", jobId))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$", hasSize<Any>(2)))
            .andExpect(jsonPath("$[0].previousStatus").value("WISHLIST"))
            .andExpect(jsonPath("$[0].nextStatus").value("APPLIED"))
            .andExpect(jsonPath("$[1].previousStatus").value("APPLIED"))
            .andExpect(jsonPath("$[1].nextStatus").value("INTERVIEW"))
    }

    @Test
    fun `paginates the cross-job feed without losing events across a page boundary`() {
        val firstJob = seedJob()
        val secondJob = seedJob()
        val thirdJob = seedJob()
        updateJobStatus(firstJob, JobStatus.APPLIED)
        updateJobStatus(secondJob, JobStatus.APPLIED)
        updateJobStatus(thirdJob, JobStatus.APPLIED)

        val firstPageBody =
            mockMvc
                .perform(get("/timeline-events").param("page", "0").param("size", "2"))
                .andExpect(status().isOk)
                .andExpect(jsonPath("$.content", hasSize<Any>(2)))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andReturn()
                .response
                .contentAsString

        mockMvc
            .perform(get("/timeline-events").param("page", "1").param("size", "2"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.content", hasSize<Any>(1)))

        assertThat(firstPageBody).contains("\"page\":0")
    }
}
