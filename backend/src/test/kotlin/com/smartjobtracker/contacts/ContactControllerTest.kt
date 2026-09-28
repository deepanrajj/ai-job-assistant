package com.smartjobtracker.contacts

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.api.error.ApiExceptionHandler
import com.smartjobtracker.contacts.dto.MAX_NAME_LENGTH
import com.smartjobtracker.testsupport.contacts.FakeContactService
import com.smartjobtracker.testsupport.contacts.createContactEntity
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

private const val VALID_CREATE_BODY = """
    {
      "type": "RECRUITER",
      "name": "Jane Recruiter",
      "email": "jane@example.com",
      "phone": "+49 170 1234567",
      "profileUrl": "https://www.linkedin.com/in/jane-recruiter",
      "lastContactedAt": "2026-07-01",
      "notes": "Reached out on LinkedIn."
    }
"""

class ContactControllerTest {
    private lateinit var contactService: FakeContactService
    private lateinit var mockMvc: MockMvc

    @BeforeEach
    fun setUp() {
        contactService = FakeContactService()
        mockMvc =
            MockMvcBuilders
                .standaloneSetup(ContactController(contactService))
                .setValidator(LocalValidatorFactoryBean().apply { afterPropertiesSet() })
                .setControllerAdvice(ApiExceptionHandler())
                .build()
    }

    @Test
    fun `lists contacts for a job`() {
        val jobId = UUID.randomUUID()
        val contact = createContactEntity(jobId = jobId, name = "Jane Recruiter")
        contactService.listHandler = { listOf(contact) }

        mockMvc
            .perform(get("/jobs/{jobId}/contacts", jobId))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$[0].id").value(contact.id.toString()))
            .andExpect(jsonPath("$[0].name").value("Jane Recruiter"))
            .andExpect(jsonPath("$[0].jobId").doesNotExist())

        assertThat(contactService.lastListedJobId).isEqualTo(jobId)
    }

    @Test
    fun `creates a contact and returns created`() {
        val jobId = UUID.randomUUID()
        val created = createContactEntity(jobId = jobId, name = "Jane Recruiter")
        contactService.createHandler = { _, _ -> created }

        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(VALID_CREATE_BODY),
            ).andExpect(status().isCreated)
            .andExpect(jsonPath("$.name").value("Jane Recruiter"))

        assertThat(contactService.lastCreateJobId).isEqualTo(jobId)
        assertThat(contactService.lastCreateCommand.type).isEqualTo(ContactType.RECRUITER)
        assertThat(contactService.lastCreateCommand.name).isEqualTo("Jane Recruiter")
        assertThat(contactService.lastCreateCommand.email).isEqualTo("jane@example.com")
    }

    @Test
    fun `creates a contact with only the required fields`() {
        val jobId = UUID.randomUUID()
        contactService.createHandler = { j, _ -> createContactEntity(jobId = j) }

        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "OTHER", "name": "Someone"}"""),
            ).andExpect(status().isCreated)

        assertThat(contactService.lastCreateCommand.email).isNull()
        assertThat(contactService.lastCreateCommand.phone).isNull()
        assertThat(contactService.lastCreateCommand.profileUrl).isNull()
        assertThat(contactService.lastCreateCommand.lastContactedAt).isNull()
        assertThat(contactService.lastCreateCommand.notes).isNull()
    }

    /**
     * `email` is sent whitespace-only on purpose: Bean Validation's
     * `@Email` would reject `"   "` as a malformed address if it saw the
     * raw value, so this proves the field is trimmed to null before
     * validation runs, not only afterwards in `toCommand()`.
     */
    @Test
    fun `trims text fields and stores blank optional fields as null`() {
        val jobId = UUID.randomUUID()
        contactService.createHandler = { j, _ -> createContactEntity(jobId = j) }

        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "type": "OTHER",
                          "name": "  Someone  ",
                          "email": "   ",
                          "phone": "  ",
                          "profileUrl": "   ",
                          "notes": "   "
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isCreated)

        assertThat(contactService.lastCreateCommand.name).isEqualTo("Someone")
        assertThat(contactService.lastCreateCommand.email).isNull()
        assertThat(contactService.lastCreateCommand.phone).isNull()
        assertThat(contactService.lastCreateCommand.profileUrl).isNull()
        assertThat(contactService.lastCreateCommand.notes).isNull()
    }

    @Test
    fun `updates a contact`() {
        val jobId = UUID.randomUUID()
        val contactId = UUID.randomUUID()
        contactService.updateHandler = { jId, cId, _ ->
            createContactEntity(jobId = jId, id = cId, name = "Updated Name")
        }

        mockMvc
            .perform(
                put("/jobs/{jobId}/contacts/{contactId}", jobId, contactId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(VALID_CREATE_BODY.replace("Jane Recruiter", "Updated Name")),
            ).andExpect(status().isOk)
            .andExpect(jsonPath("$.name").value("Updated Name"))

        assertThat(contactService.lastUpdateJobId).isEqualTo(jobId)
        assertThat(contactService.lastUpdateContactId).isEqualTo(contactId)
        assertThat(contactService.lastUpdateCommand.name).isEqualTo("Updated Name")
    }

    @Test
    fun `trims optional fields on update before validating them`() {
        val jobId = UUID.randomUUID()
        val contactId = UUID.randomUUID()
        contactService.updateHandler = { jId, cId, _ -> createContactEntity(jobId = jId, id = cId) }

        mockMvc
            .perform(
                put("/jobs/{jobId}/contacts/{contactId}", jobId, contactId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "type": "OTHER",
                          "name": "Someone",
                          "email": "   ",
                          "phone": null,
                          "profileUrl": " https://www.linkedin.com/in/jane-recruiter ",
                          "lastContactedAt": null,
                          "notes": null
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isOk)

        assertThat(contactService.lastUpdateCommand.email).isNull()
        assertThat(contactService.lastUpdateCommand.profileUrl)
            .isEqualTo("https://www.linkedin.com/in/jane-recruiter")
    }

    @Test
    fun `deletes a contact and returns no content`() {
        val jobId = UUID.randomUUID()
        val contactId = UUID.randomUUID()

        mockMvc
            .perform(delete("/jobs/{jobId}/contacts/{contactId}", jobId, contactId))
            .andExpect(status().isNoContent)

        assertThat(contactService.lastDeleteJobId).isEqualTo(jobId)
        assertThat(contactService.lastDeleteContactId).isEqualTo(contactId)
    }

    @Test
    fun `rejects a create request with a blank name`() {
        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "RECRUITER", "name": " "}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("name"))
    }

    @Test
    fun `rejects a create request missing the type field`() {
        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"name": "Someone"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
    }

    @Test
    fun `rejects a create request with an over-length name`() {
        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "RECRUITER", "name": "${"a".repeat(256)}"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("name"))
    }

    @Test
    fun `accepts padded email and profile url values and stores them trimmed`() {
        val jobId = UUID.randomUUID()
        contactService.createHandler = { j, _ -> createContactEntity(jobId = j) }

        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "type": "OTHER",
                          "name": "Someone",
                          "email": " jane@example.com ",
                          "profileUrl": " https://www.linkedin.com/in/jane-recruiter "
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isCreated)

        assertThat(contactService.lastCreateCommand.email).isEqualTo("jane@example.com")
        assertThat(contactService.lastCreateCommand.profileUrl)
            .isEqualTo("https://www.linkedin.com/in/jane-recruiter")
    }

    @Test
    fun `accepts a profile url with an upper-case scheme`() {
        val jobId = UUID.randomUUID()
        contactService.createHandler = { j, _ -> createContactEntity(jobId = j) }

        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "type": "OTHER",
                          "name": "Someone",
                          "profileUrl": "HTTPS://www.linkedin.com/in/jane-recruiter"
                        }
                        """.trimIndent(),
                    ),
            ).andExpect(status().isCreated)

        assertThat(contactService.lastCreateCommand.profileUrl)
            .isEqualTo("HTTPS://www.linkedin.com/in/jane-recruiter")
    }

    @Test
    fun `accepts a maximum-length name padded with whitespace and stores it trimmed`() {
        val jobId = UUID.randomUUID()
        val name = "a".repeat(MAX_NAME_LENGTH)
        contactService.createHandler = { j, _ -> createContactEntity(jobId = j) }

        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", jobId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "OTHER", "name": " $name "}"""),
            ).andExpect(status().isCreated)

        assertThat(contactService.lastCreateCommand.name).isEqualTo(name)
    }

    @Test
    fun `rejects a last contacted date with a year outside four digits`() {
        listOf("+10000-01-01", "-0001-01-01").forEach { lastContactedAt ->
            mockMvc
                .perform(
                    post("/jobs/{jobId}/contacts", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(
                            """{"type": "OTHER", "name": "Someone", "lastContactedAt": "$lastContactedAt"}""",
                        ),
                ).andExpect(status().isBadRequest)
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("lastContactedAt"))
        }
    }

    @Test
    fun `rejects an update with a last contacted date beyond year 9999`() {
        mockMvc
            .perform(
                put("/jobs/{jobId}/contacts/{contactId}", UUID.randomUUID(), UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(VALID_CREATE_BODY.replace("2026-07-01", "+10000-01-01")),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("lastContactedAt"))
    }

    @Test
    fun `rejects a create request with a malformed email`() {
        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "RECRUITER", "name": "Someone", "email": "not-an-email"}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("email"))
    }

    @Test
    fun `rejects a create request with a non-http profile url`() {
        mockMvc
            .perform(
                post("/jobs/{jobId}/contacts", UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """{"type": "RECRUITER", "name": "Someone", "profileUrl": "javascript:alert(1)"}""",
                    ),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("profileUrl"))
    }

    @Test
    fun `rejects an update request with a blank name`() {
        mockMvc
            .perform(
                put("/jobs/{jobId}/contacts/{contactId}", UUID.randomUUID(), UUID.randomUUID())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("""{"type": "RECRUITER", "name": " "}"""),
            ).andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("name"))
    }

    @Test
    fun `returns job not found when the service reports a missing job`() {
        contactService.listHandler = {
            throw ApiException(
                status = HttpStatus.NOT_FOUND,
                errorCode = ApiErrorCode.JOB_NOT_FOUND,
                message = "Job not found.",
            )
        }

        mockMvc
            .perform(get("/jobs/{jobId}/contacts", UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("JOB_NOT_FOUND"))
    }

    @Test
    fun `returns contact not found when the service reports a missing contact`() {
        contactService.deleteHandler = { _, _ ->
            throw ApiException(
                status = HttpStatus.NOT_FOUND,
                errorCode = ApiErrorCode.CONTACT_NOT_FOUND,
                message = "Contact not found.",
            )
        }

        mockMvc
            .perform(delete("/jobs/{jobId}/contacts/{contactId}", UUID.randomUUID(), UUID.randomUUID()))
            .andExpect(status().isNotFound)
            .andExpect(jsonPath("$.code").value("CONTACT_NOT_FOUND"))
    }

    @Test
    fun `returns bad request when the job id path segment is not a uuid`() {
        mockMvc
            .perform(get("/jobs/{jobId}/contacts", "not-a-uuid"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.INVALID_REQUEST_PARAMETER.value))
    }

    @Test
    fun `returns bad request when the contact id path segment is not a uuid`() {
        mockMvc
            .perform(delete("/jobs/{jobId}/contacts/{contactId}", UUID.randomUUID(), "not-a-uuid"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.code").value(ApiErrorCode.INVALID_REQUEST_PARAMETER.value))
    }
}
