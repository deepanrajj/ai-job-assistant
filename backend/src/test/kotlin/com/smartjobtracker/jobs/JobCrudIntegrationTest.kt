package com.smartjobtracker.jobs

import com.smartjobtracker.jobs.dto.JobResponse
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.jobs.jobFixtureTimestamp
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.ObjectMapper
import java.util.UUID

/**
 * End-to-end coverage of the job routes against the real application
 * context: the real controller, service, repository, Flyway-created
 * schema, and the application's own Jackson configuration.
 *
 * Branch-level cases stay in the isolated layer tests. This class
 * covers the seams those tests replace with fakes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class JobCrudIntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var objectMapper: ObjectMapper

    private fun postJob(body: String): JobResponse {
        val responseBody =
            mockMvc
                .perform(
                    post("/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body),
                ).andExpect(status().isCreated)
                .andReturn()
                .response
                .contentAsString

        return objectMapper.readValue(responseBody, JobResponse::class.java)
    }

    @Test
    fun `creates a job over http and stores it in the database`() {
        val created =
            postJob(
                """
                {
                  "company": "Acme Corp",
                  "roleTitle": "Backend Engineer",
                  "location": "Remote",
                  "jobUrl": "https://example.com/jobs/1",
                  "salaryMin": 90000.00,
                  "salaryMax": 120000.00,
                  "description": "Build and maintain backend services."
                }
                """.trimIndent(),
            )

        assertThat(created.company).isEqualTo("Acme Corp")
        assertThat(created.roleTitle).isEqualTo("Backend Engineer")
        assertThat(created.status).isEqualTo(JobStatus.WISHLIST)
        assertThat(created.createdAt).isEqualTo(created.updatedAt)

        val stored = jobRepository.findById(created.id)

        assertThat(stored).isPresent()
        assertThat(stored.get().company).isEqualTo("Acme Corp")
        assertThat(stored.get().salaryMin).isEqualByComparingTo("90000.00")
        assertThat(stored.get().userId).isNull()
    }

    @Test
    fun `reads a created job back over http`() {
        val created = postJob("""{"company": "Acme Corp", "roleTitle": "Backend Engineer"}""")

        mockMvc
            .perform(get("/jobs/{id}", created.id))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(created.id.toString()))
            .andExpect(jsonPath("$.company").value("Acme Corp"))
            .andExpect(jsonPath("$.status").value("WISHLIST"))
    }

    @Test
    fun `lists jobs newest updated first`() {
        jobRepository.save(createJobEntity(company = "Middle", updatedAt = jobFixtureTimestamp.minusDays(2)))
        jobRepository.save(createJobEntity(company = "Newest", updatedAt = jobFixtureTimestamp.minusDays(1)))
        jobRepository.save(createJobEntity(company = "Oldest", updatedAt = jobFixtureTimestamp.minusDays(3)))

        mockMvc
            .perform(get("/jobs"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].company").value("Newest"))
            .andExpect(jsonPath("$[1].company").value("Middle"))
            .andExpect(jsonPath("$[2].company").value("Oldest"))
    }

    @Test
    fun `updates a job over http and preserves its creation time`() {
        val seeded =
            jobRepository.save(
                createJobEntity(
                    company = "Old Corp",
                    createdAt = jobFixtureTimestamp.minusDays(10),
                    updatedAt = jobFixtureTimestamp.minusDays(10),
                ),
            )

        // Capture the values now: `seeded` is the managed instance, so the
        // update writes through it and comparing against it later would
        // compare the entity with itself.
        val seededId = seeded.id
        val originalCreatedAt = seeded.createdAt
        val originalUpdatedAt = seeded.updatedAt

        mockMvc
            .perform(
                put("/jobs/{id}", seededId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "company": "New Corp",
                          "roleTitle": "Staff Engineer",
                          "status": "OFFER",
                          "location": null,
                          "jobUrl": null,
                          "salaryMin": null,
                          "salaryMax": null,
                          "description": "Updated."
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.company").value("New Corp"))
            .andExpect(jsonPath("$.status").value("OFFER"))
            .andExpect(jsonPath("$.location").doesNotExist())

        val stored = jobRepository.findById(seededId).orElseThrow()

        assertThat(stored.company).isEqualTo("New Corp")
        assertThat(stored.status).isEqualTo(JobStatus.OFFER)
        assertThat(stored.salaryMin).isNull()
        assertThat(stored.createdAt).isEqualTo(originalCreatedAt)
        assertThat(stored.updatedAt).isAfter(originalUpdatedAt)
    }

    @Test
    fun `deletes a job over http and removes it from the database`() {
        val seeded = jobRepository.save(createJobEntity())

        mockMvc
            .perform(delete("/jobs/{id}", seeded.id))
            .andExpect(status().isNoContent)

        assertThat(jobRepository.existsById(seeded.id)).isFalse()
    }

    @Test
    fun `returns not found for read update and delete of an unknown job`() {
        val unknownId = UUID.randomUUID()
        val updateBody =
            """
            {
              "company": "Acme Corp",
              "roleTitle": "Backend Engineer",
              "status": "APPLIED",
              "location": null,
              "jobUrl": null,
              "salaryMin": null,
              "salaryMax": null,
              "description": null
            }
            """.trimIndent()

        mockMvc
            .perform(get("/jobs/{id}", unknownId))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Job not found."))

        mockMvc
            .perform(
                put("/jobs/{id}", unknownId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(updateBody),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))

        mockMvc
            .perform(delete("/jobs/{id}", unknownId))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
    }

    @Test
    fun `returns a validation error through the real error handler`() {
        mockMvc
            .perform(
                post("/jobs")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"company": " ", "roleTitle": "Backend Engineer"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("company"))
    }

    @Test
    fun `response body omits user id and serializes timestamps as iso instants`() {
        val seeded = jobRepository.save(createJobEntity(userId = UUID.randomUUID()))

        val responseBody =
            mockMvc
                .perform(get("/jobs/{id}", seeded.id))
                .andExpect(status().isOk)
                .andReturn()
                .response
                .contentAsString

        assertThat(responseBody).doesNotContain("userId")
        assertThat(responseBody).containsPattern("\"createdAt\":\"\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z\"")
        assertThat(responseBody).containsPattern("\"updatedAt\":\"\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z\"")
    }
}
