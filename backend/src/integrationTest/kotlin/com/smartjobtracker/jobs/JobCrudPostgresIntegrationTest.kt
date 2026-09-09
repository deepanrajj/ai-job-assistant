package com.smartjobtracker.jobs

import com.smartjobtracker.tasks.Task
import com.smartjobtracker.tasks.TaskRepository
import com.smartjobtracker.testsupport.containers.PostgresContainerConfiguration
import com.smartjobtracker.testsupport.jobs.createJobEntity
import com.smartjobtracker.testsupport.tasks.createTaskEntity
import jakarta.persistence.EntityManager
import jakarta.persistence.PersistenceContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
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
import java.math.BigDecimal

/**
 * The job routes against real PostgreSQL rather than H2, so the column
 * types the schema actually uses are exercised: `uuid` primary keys,
 * `timestamptz` against `OffsetDateTime`, and `numeric` precision on the
 * salary columns. `JobCrudIntegrationTest` covers the same routes on H2
 * and stays as the fast check.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgresContainerConfiguration::class)
@Transactional
class JobCrudPostgresIntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var taskRepository: TaskRepository

    @Autowired
    lateinit var objectMapper: ObjectMapper

    @PersistenceContext
    lateinit var entityManager: EntityManager

    @Test
    fun `creates reads updates and deletes a job over http`() {
        val createdId =
            objectMapper
                .readTree(
                    mockMvc
                        .perform(
                            post("/jobs")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                    """
                                    {
                                      "company": "Postgres Corp",
                                      "roleTitle": "Backend Engineer",
                                      "salaryMin": 90000.55,
                                      "salaryMax": 120000.45
                                    }
                                    """.trimIndent(),
                                ),
                        ).andExpect(status().isCreated)
                        .andReturn()
                        .response
                        .contentAsString,
                ).get("id")
                .asString()

        mockMvc
            .perform(get("/jobs/$createdId"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.company").value("Postgres Corp"))
            // Decimal places survive the numeric(12,2) round trip. H2 is
            // more forgiving about scale than PostgreSQL is.
            .andExpect(jsonPath("$.salaryMin").value(90000.55))
            .andExpect(jsonPath("$.salaryMax").value(120000.45))

        mockMvc
            .perform(
                put("/jobs/$createdId")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "company": "Renamed Corp",
                          "roleTitle": "Staff Engineer",
                          "location": null,
                          "status": "OFFER",
                          "jobUrl": null,
                          "salaryMin": null,
                          "salaryMax": null,
                          "description": null
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.company").value("Renamed Corp"))
            .andExpect(jsonPath("$.status").value("OFFER"))

        mockMvc.perform(delete("/jobs/$createdId")).andExpect(status().isNoContent)
        mockMvc.perform(get("/jobs/$createdId")).andExpect(status().isNotFound)
    }

    @Test
    fun `saving a new job inserts without a preceding select`() {
        // Bug 001 was found and fixed against H2. Assigned-id handling
        // goes through the JDBC driver and dialect, so it is worth
        // proving on the real database as well.
        val job = createJobEntity(company = "Insert Path Corp")

        val saved = jobRepository.save(job)
        entityManager.flush()

        assertThat(saved).isSameAs(job)
        assertThat(job.isNew()).isFalse()
    }

    @Test
    fun `deleting a job cascades to its tasks in the database`() {
        // The cascade lives in the migration as an on delete cascade
        // foreign key, not in JPA, so only a real database proves it.
        val job = jobRepository.save(createJobEntity(company = "Cascade Corp"))
        val task: Task = taskRepository.save(createTaskEntity(jobId = job.id))
        entityManager.flush()

        jobRepository.deleteById(job.id)
        entityManager.flush()
        entityManager.clear()

        assertThat(taskRepository.findById(task.id)).isEmpty
    }

    @Test
    fun `stores salary precision without rounding`() {
        val job =
            jobRepository.save(
                createJobEntity(
                    company = "Precision Corp",
                    salaryMin = BigDecimal("12345.67"),
                    salaryMax = BigDecimal("98765.43"),
                ),
            )
        entityManager.flush()
        entityManager.clear()

        val loaded = jobRepository.findById(job.id).orElseThrow()

        assertThat(loaded.salaryMin).isEqualByComparingTo("12345.67")
        assertThat(loaded.salaryMax).isEqualByComparingTo("98765.43")
    }
}
