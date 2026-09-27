package com.smartjobtracker.contacts

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.contacts.command.CreateContactCommand
import com.smartjobtracker.contacts.command.UpdateContactCommand
import com.smartjobtracker.jobs.JobRepository
import com.smartjobtracker.jobs.JobService
import com.smartjobtracker.testsupport.api.assertApiException
import com.smartjobtracker.testsupport.contacts.createContactEntity
import com.smartjobtracker.testsupport.jobs.createJobEntity
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.catchThrowableOfType
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneOffset
import java.util.UUID

@SpringBootTest
@Transactional
class ContactServiceTest {
    @Autowired
    lateinit var contactRepository: ContactRepository

    @Autowired
    lateinit var jobRepository: JobRepository

    @Autowired
    lateinit var jobService: JobService

    private val fixedClock: Clock = Clock.fixed(Instant.parse("2026-07-05T12:00:00Z"), ZoneOffset.UTC)

    private val expectedNow: OffsetDateTime = OffsetDateTime.now(fixedClock)

    private lateinit var contactService: ContactService

    @BeforeEach
    fun setUp() {
        contactService = DefaultContactService(jobService, contactRepository, fixedClock)
    }

    private fun seedJob(): UUID = jobRepository.save(createJobEntity()).id

    private fun seedContact(
        jobId: UUID,
        name: String = "Seeded Contact",
        createdAt: OffsetDateTime = expectedNow.minusDays(1),
    ): Contact =
        contactRepository.save(
            createContactEntity(jobId = jobId, name = name, createdAt = createdAt, updatedAt = createdAt),
        )

    private fun createCommand(
        type: ContactType = ContactType.RECRUITER,
        name: String = "Jane Recruiter",
        email: String? = "jane@example.com",
        phone: String? = "+49 170 1234567",
        profileUrl: String? = "https://www.linkedin.com/in/jane-recruiter",
        lastContactedAt: LocalDate? = LocalDate.parse("2026-07-01"),
        notes: String? = "Reached out on LinkedIn.",
    ) = CreateContactCommand(
        type = type,
        name = name,
        email = email,
        phone = phone,
        profileUrl = profileUrl,
        lastContactedAt = lastContactedAt,
        notes = notes,
    )

    @Test
    fun `lists a job's contacts in creation order`() {
        val jobId = seedJob()
        seedContact(jobId, name = "Newer", createdAt = expectedNow.minusDays(1))
        seedContact(jobId, name = "Older", createdAt = expectedNow.minusDays(2))
        seedContact(seedJob(), name = "Other job")

        val names = contactService.listContacts(jobId).map { it.name }

        assertThat(names).containsExactly("Older", "Newer")
    }

    @Test
    fun `throws job not found when listing contacts for a missing job`() {
        val exception =
            catchThrowableOfType(ApiException::class.java) { contactService.listContacts(UUID.randomUUID()) }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `creates a contact with the job id and clock timestamps`() {
        val jobId = seedJob()

        val created = contactService.createContact(jobId, createCommand())

        assertThat(created.jobId).isEqualTo(jobId)
        assertThat(created.type).isEqualTo(ContactType.RECRUITER)
        assertThat(created.name).isEqualTo("Jane Recruiter")
        assertThat(created.email).isEqualTo("jane@example.com")
        assertThat(created.phone).isEqualTo("+49 170 1234567")
        assertThat(created.profileUrl).isEqualTo("https://www.linkedin.com/in/jane-recruiter")
        assertThat(created.lastContactedAt).isEqualTo(LocalDate.parse("2026-07-01"))
        assertThat(created.notes).isEqualTo("Reached out on LinkedIn.")
        assertThat(created.createdAt).isEqualTo(expectedNow)
        assertThat(created.updatedAt).isEqualTo(expectedNow)
        assertThat(contactRepository.existsById(created.id)).isTrue()
    }

    @Test
    fun `creates a contact with every optional field null`() {
        val jobId = seedJob()
        val command =
            createCommand(email = null, phone = null, profileUrl = null, lastContactedAt = null, notes = null)

        val created = contactService.createContact(jobId, command)

        assertThat(created.email).isNull()
        assertThat(created.phone).isNull()
        assertThat(created.profileUrl).isNull()
        assertThat(created.lastContactedAt).isNull()
        assertThat(created.notes).isNull()
    }

    /**
     * `CreateContactCommand`'s optional fields all default to null. Every
     * other test builds one through `createCommand()` or
     * `CreateContactRequest.toCommand()`, both of which always name every
     * parameter, so the default values themselves are otherwise never
     * exercised.
     */
    @Test
    fun `creates a contact using the command's own defaults for every optional field`() {
        val jobId = seedJob()

        val created =
            contactService.createContact(jobId, CreateContactCommand(type = ContactType.OTHER, name = "Someone"))

        assertThat(created.email).isNull()
        assertThat(created.phone).isNull()
        assertThat(created.profileUrl).isNull()
        assertThat(created.lastContactedAt).isNull()
        assertThat(created.notes).isNull()
    }

    @Test
    fun `throws job not found when creating a contact for a missing job`() {
        val exception =
            catchThrowableOfType(ApiException::class.java) {
                contactService.createContact(UUID.randomUUID(), createCommand())
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `updates every field, preserves id, job id, and creation time, and refreshes updatedAt`() {
        val jobId = seedJob()
        val seeded = seedContact(jobId)
        val command =
            UpdateContactCommand(
                type = ContactType.HIRING_MANAGER,
                name = "Updated Name",
                email = "updated@example.com",
                phone = "+1 555 0100",
                profileUrl = "https://www.linkedin.com/in/updated",
                lastContactedAt = LocalDate.parse("2026-08-01"),
                notes = "Updated notes.",
            )

        val updated = contactService.updateContact(jobId, seeded.id, command)

        assertThat(updated.id).isEqualTo(seeded.id)
        assertThat(updated.jobId).isEqualTo(jobId)
        assertThat(updated.createdAt).isEqualTo(seeded.createdAt)
        assertThat(updated.type).isEqualTo(ContactType.HIRING_MANAGER)
        assertThat(updated.name).isEqualTo("Updated Name")
        assertThat(updated.email).isEqualTo("updated@example.com")
        assertThat(updated.phone).isEqualTo("+1 555 0100")
        assertThat(updated.profileUrl).isEqualTo("https://www.linkedin.com/in/updated")
        assertThat(updated.lastContactedAt).isEqualTo(LocalDate.parse("2026-08-01"))
        assertThat(updated.notes).isEqualTo("Updated notes.")
        assertThat(updated.updatedAt).isEqualTo(expectedNow)
    }

    @Test
    fun `throws job not found when updating a contact under a missing job`() {
        val jobId = seedJob()
        val seeded = seedContact(jobId)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                contactService.updateContact(UUID.randomUUID(), seeded.id, updateCommandFor(seeded))
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `throws contact not found when updating a missing contact`() {
        val jobId = seedJob()

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                contactService.updateContact(jobId, UUID.randomUUID(), updateCommandFor(seedContact(jobId)))
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.CONTACT_NOT_FOUND,
            message = "Contact not found.",
        )
    }

    @Test
    fun `throws contact not found and leaves it unchanged when updating a contact under another job`() {
        val ownJobId = seedJob()
        val otherJobId = seedJob()
        val seeded = seedContact(otherJobId, name = "Untouched")
        val command = updateCommandFor(seeded).copy(name = "Hijacked")

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                contactService.updateContact(ownJobId, seeded.id, command)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.CONTACT_NOT_FOUND,
            message = "Contact not found.",
        )
        val stillSeeded = contactRepository.findById(seeded.id).orElseThrow()
        assertThat(stillSeeded.name).isEqualTo("Untouched")
    }

    @Test
    fun `deletes a contact`() {
        val jobId = seedJob()
        val seeded = seedContact(jobId)

        contactService.deleteContact(jobId, seeded.id)

        assertThat(contactRepository.existsById(seeded.id)).isFalse()
    }

    @Test
    fun `throws job not found when deleting a contact under a missing job`() {
        val jobId = seedJob()
        val seeded = seedContact(jobId)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                contactService.deleteContact(UUID.randomUUID(), seeded.id)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.JOB_NOT_FOUND,
            message = "Job not found.",
        )
    }

    @Test
    fun `throws contact not found when deleting a missing contact`() {
        val jobId = seedJob()

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                contactService.deleteContact(jobId, UUID.randomUUID())
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.CONTACT_NOT_FOUND,
            message = "Contact not found.",
        )
    }

    @Test
    fun `throws contact not found and keeps it when deleting a contact under another job`() {
        val ownJobId = seedJob()
        val otherJobId = seedJob()
        val seeded = seedContact(otherJobId)

        val exception =
            catchThrowableOfType(ApiException::class.java) {
                contactService.deleteContact(ownJobId, seeded.id)
            }

        assertApiException(
            exception = exception,
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.CONTACT_NOT_FOUND,
            message = "Contact not found.",
        )
        assertThat(contactRepository.existsById(seeded.id)).isTrue()
    }

    private fun updateCommandFor(contact: Contact) =
        UpdateContactCommand(
            type = contact.type,
            name = contact.name,
            email = contact.email,
            phone = contact.phone,
            profileUrl = contact.profileUrl,
            lastContactedAt = contact.lastContactedAt,
            notes = contact.notes,
        )
}
