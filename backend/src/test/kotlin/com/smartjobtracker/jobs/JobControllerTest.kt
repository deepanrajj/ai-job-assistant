package com.smartjobtracker.jobs

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.api.error.ApiExceptionHandler
import com.smartjobtracker.testsupport.jobs.FakeJobService
import com.smartjobtracker.testsupport.jobs.createJobEntity
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean
import java.util.UUID

class JobControllerTest {
    private lateinit var jobService: FakeJobService
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        jobService = FakeJobService()
        mockMvc =
            MockMvcBuilders
                .standaloneSetup(JobController(jobService))
                .setValidator(LocalValidatorFactoryBean().apply { afterPropertiesSet() })
                .setControllerAdvice(ApiExceptionHandler())
                .build()
    }

    @Test
    fun `lists jobs`() {
        val job = createJobEntity(company = "Acme Corp", status = JobStatus.APPLIED)
        jobService.listHandler = { listOf(job) }

        mockMvc
            .perform(get("/jobs"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(job.id.toString()))
            .andExpect(jsonPath("$[0].company").value("Acme Corp"))
            .andExpect(jsonPath("$[0].status").value("APPLIED"))
            .andExpect(jsonPath("$[0].userId").doesNotExist())
    }

    @Test
    fun `returns a job by id`() {
        val job = createJobEntity(company = "Acme Corp")
        jobService.getHandler = { job }

        mockMvc
            .perform(get("/jobs/{id}", job.id))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.id").value(job.id.toString()))
            .andExpect(jsonPath("$.company").value("Acme Corp"))

        assertThat(jobService.lastRequestedId).isEqualTo(job.id)
    }

    @Test
    fun `creates a job and returns created`() {
        val job = createJobEntity(company = "Acme Corp", status = JobStatus.APPLIED)
        jobService.createHandler = { job }

        mockMvc
            .perform(
                post("/jobs")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "company": "Acme Corp",
                          "roleTitle": "Backend Engineer",
                          "status": "APPLIED",
                          "location": "Remote"
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.company").value("Acme Corp"))
            .andExpect(jsonPath("$.status").value("APPLIED"))

        assertThat(jobService.lastCreateCommand.company).isEqualTo("Acme Corp")
        assertThat(jobService.lastCreateCommand.roleTitle).isEqualTo("Backend Engineer")
        assertThat(jobService.lastCreateCommand.status).isEqualTo(JobStatus.APPLIED)
        assertThat(jobService.lastCreateCommand.location).isEqualTo("Remote")
    }

    @Test
    fun `creates a job without status using the wishlist default`() {
        mockMvc
            .perform(
                post("/jobs")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"company": "Acme Corp", "roleTitle": "Backend Engineer"}"""),
            ).andExpect(status().isCreated)

        assertThat(jobService.lastCreateCommand.status).isEqualTo(JobStatus.WISHLIST)
        assertThat(jobService.lastCreateCommand.location).isNull()
    }

    @Test
    fun `updates a job`() {
        val id = UUID.randomUUID()
        jobService.updateHandler = { jobId, _ -> createJobEntity(id = jobId, company = "New Corp") }

        mockMvc
            .perform(
                put("/jobs/{id}", id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "company": "New Corp",
                          "roleTitle": "Staff Engineer",
                          "status": "OFFER"
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.company").value("New Corp"))

        assertThat(jobService.lastUpdateId).isEqualTo(id)
        assertThat(jobService.lastUpdateCommand.company).isEqualTo("New Corp")
        assertThat(jobService.lastUpdateCommand.status).isEqualTo(JobStatus.OFFER)
        assertThat(jobService.lastUpdateCommand.location).isNull()
    }

    @Test
    fun `deletes a job and returns no content`() {
        val id = UUID.randomUUID()

        mockMvc
            .perform(delete("/jobs/{id}", id))
            .andExpect(status().isNoContent)

        assertThat(jobService.lastDeletedId).isEqualTo(id)
    }

    @Test
    fun `rejects a create request with a blank company`() {
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
    fun `rejects a create request with a blank role title`() {
        mockMvc
            .perform(
                post("/jobs")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"company": "Acme Corp", "roleTitle": " "}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("roleTitle"))
    }

    @Test
    fun `rejects a create request with a company longer than the column allows`() {
        val overlongCompany = "A".repeat(256)

        mockMvc
            .perform(
                post("/jobs")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"company": "$overlongCompany", "roleTitle": "Backend Engineer"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("company"))
    }

    @Test
    fun `rejects a create request with a salary outside the column precision`() {
        mockMvc
            .perform(
                post("/jobs")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """{"company": "Acme Corp", "roleTitle": "Backend Engineer", "salaryMin": 99999999999999}""",
                    ),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("salaryMin"))
    }

    @Test
    fun `rejects a create request with an unknown status value`() {
        mockMvc
            .perform(
                post("/jobs")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"company": "Acme Corp", "roleTitle": "Backend Engineer", "status": "NOT_A_STATUS"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
    }

    @Test
    fun `rejects an update request without a status`() {
        mockMvc
            .perform(
                put("/jobs/{id}", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"company": "Acme Corp", "roleTitle": "Backend Engineer"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("status"))
    }

    @Test
    fun `returns not found when the service reports a missing job`() {
        jobService.getHandler = {
            throw ApiException(
                status = HttpStatus.NOT_FOUND,
                errorCode = ApiErrorCode.JOB_NOT_FOUND,
                message = "Job not found.",
            )
        }

        mockMvc
            .perform(get("/jobs/{id}", UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
            .andExpect(jsonPath("$.message").value("Job not found."))
    }
}
