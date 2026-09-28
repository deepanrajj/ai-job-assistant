package com.smartjobtracker.contacts

import com.smartjobtracker.contacts.dto.ContactResponse
import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.testsupport.contacts.contactFixtureTimestamp
import com.smartjobtracker.testsupport.contacts.createContactEntity
import com.smartjobtracker.testsupport.jobs.createJobEntity
import org.assertj.core.api.Assertions.assertThat
import org.hamcrest.Matchers.hasSize
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
 * End-to-end coverage of the contact routes against the real application
 * context: the real controller, service, repository, Flyway-created
 * schema, and the application's own Jackson configuration.
 *
 * Branch-level cases stay in the isolated layer tests. This class covers
 * the seams those tests replace with fakes, mirroring
 * `NoteCrudIntegrationTest`. It deliberately does not re-cover the
 * job-delete-cascades-to-contacts case: `contacts.jobId` is a plain
 * column, not a JPA association, so Hibernate has no way to know a
 * pending `Job` removal could affect the `contacts` table and may skip
 * flushing it before an unrelated `Contact` query - `existsById` right
 * after an HTTP job delete can read a row Postgres has already dropped
 * but Hibernate has not yet sent the `DELETE` for. `ContactPersistenceTest`
 * proves the cascade correctly, with the explicit flush and
 * `entityManager.clear()` that assertion needs.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ContactCrudIntegrationTest {
    @Autowired
    lateinit var mockMvc: MockMvc

    @Autowired
    lateinit var contactRepository: ContactRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var objectMapper: ObjectMapper

    private fun seedJob(): UUID = jobRepository.save(createJobEntity()).id

    private fun postContact(
        jobId: UUID,
        body: String,
    ): ContactResponse {
        val responseBody =
            mockMvc
                .perform(
                    post("/jobs/{jobId}/contacts", jobId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body),
                ).andExpect(status().isCreated)
                .andReturn()
                .response
                .contentAsString

        return objectMapper.readValue(responseBody, ContactResponse::class.java)
    }

    @Test
    fun `creates a contact over http and stores it in the database`() {
        val jobId = seedJob()

        val created =
            postContact(
                jobId,
                """
                {
                  "type": "RECRUITER",
                  "name": "Jane Recruiter",
                  "email": "jane@example.com",
                  "lastContactedAt": "2026-07-01"
                }
                """.trimIndent(),
            )

        assertThat(created.name).isEqualTo("Jane Recruiter")
        assertThat(created.createdAt).isEqualTo(created.updatedAt)

        val stored = contactRepository.findById(created.id)

        assertThat(stored).isPresent()
        assertThat(stored.get().jobId).isEqualTo(jobId)
        assertThat(stored.get().name).isEqualTo("Jane Recruiter")
        assertThat(stored.get().email).isEqualTo("jane@example.com")
    }

    @Test
    fun `lists contacts for a job in creation order`() {
        val jobId = seedJob()
        val newer =
            contactRepository.save(
                createContactEntity(
                    jobId = jobId,
                    name = "Newer",
                    createdAt = contactFixtureTimestamp.plusDays(1),
                ),
            )
        val older =
            contactRepository.save(
                createContactEntity(
                    jobId = jobId,
                    name = "Older",
                    createdAt = contactFixtureTimestamp.minusDays(1),
                ),
            )
        contactRepository.save(createContactEntity(jobId = seedJob(), name = "Other job"))

        mockMvc
            .perform(get("/jobs/{jobId}/contacts", jobId))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(older.id.toString()))
            .andExpect(jsonPath("$[1].id").value(newer.id.toString()))
            .andExpect(jsonPath("$", hasSize<Any>(2)))
    }

    @Test
    fun `updates a contact over http and preserves its creation time`() {
        val jobId = seedJob()
        val seeded = postContact(jobId, """{"type": "RECRUITER", "name": "Original"}""")

        mockMvc
            .perform(
                put("/jobs/{jobId}/contacts/{contactId}", jobId, seeded.id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "REFERRAL", "name": "Updated"}"""),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.name").value("Updated"))
            .andExpect(jsonPath("$.type").value("REFERRAL"))

        val stored = contactRepository.findById(seeded.id).orElseThrow()

        assertThat(stored.name).isEqualTo("Updated")
        assertThat(stored.type).isEqualTo(ContactType.REFERRAL)
        assertThat(stored.createdAt).isEqualTo(seeded.createdAt)
        assertThat(stored.updatedAt).isAfterOrEqualTo(seeded.updatedAt)
    }

    @Test
    fun `deletes a contact over http and removes it from the database`() {
        val jobId = seedJob()
        val seeded = postContact(jobId, """{"type": "RECRUITER", "name": "Jane Recruiter"}""")

        mockMvc
            .perform(delete("/jobs/{jobId}/contacts/{contactId}", jobId, seeded.id))
            .andExpect(status().isNoContent)

        assertThat(contactRepository.existsById(seeded.id)).isFalse()
    }

    @Test
    fun `returns job not found for create update and delete under an unknown job`() {
        val unknownJobId = UUID.randomUUID()

        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", unknownJobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "RECRUITER", "name": "Jane Recruiter"}"""),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))

        mockMvc
            .perform(
                put("/jobs/{jobId}/contacts/{contactId}", unknownJobId, UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "RECRUITER", "name": "Jane Recruiter"}"""),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))

        mockMvc
            .perform(delete("/jobs/{jobId}/contacts/{contactId}", unknownJobId, UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
    }

    @Test
    fun `returns contact not found for update and delete of an unknown contact under a real job`() {
        val jobId = seedJob()
        val unknownContactId = UUID.randomUUID()

        mockMvc
            .perform(
                put("/jobs/{jobId}/contacts/{contactId}", jobId, unknownContactId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "RECRUITER", "name": "Jane Recruiter"}"""),
            ).andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("CONTACT_NOT_FOUND"))

        mockMvc
            .perform(delete("/jobs/{jobId}/contacts/{contactId}", jobId, unknownContactId))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("CONTACT_NOT_FOUND"))
    }

    @Test
    fun `returns a validation error through the real error handler`() {
        val jobId = seedJob()

        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "RECRUITER", "name": " "}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("name"))
    }

    @Test
    fun `response body omits job id and serializes the last contacted date as an iso date`() {
        val jobId = seedJob()
        postContact(
            jobId,
            """{"type": "RECRUITER", "name": "Jane Recruiter", "lastContactedAt": "2026-07-01"}""",
        )

        val responseBody =
            mockMvc
                .perform(get("/jobs/{jobId}/contacts", jobId))
                .andExpect(status().isOk)
                .andReturn()
                .response
                .contentAsString

        assertThat(responseBody).doesNotContain("\"jobId\"")
        assertThat(responseBody).contains("\"lastContactedAt\":\"2026-07-01\"")
        assertThat(responseBody).containsPattern("\"createdAt\":\"\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z\"")
        assertThat(responseBody).containsPattern("\"updatedAt\":\"\\d{4}-\\d{2}-\\d{2}T[0-9:.]+Z\"")
    }
}
