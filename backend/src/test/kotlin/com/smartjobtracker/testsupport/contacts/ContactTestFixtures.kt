package com.smartjobtracker.testsupport.contacts

import com.smartjobtracker.contacts.Contact
import com.smartjobtracker.contacts.ContactService
import com.smartjobtracker.contacts.ContactType
import com.smartjobtracker.contacts.command.CreateContactCommand
import com.smartjobtracker.contacts.command.UpdateContactCommand
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

internal val contactFixtureTimestamp: OffsetDateTime = OffsetDateTime.parse("2026-07-05T12:00:00Z")

/**
 * Builds a contact for tests. `jobId` has no default because there is no
 * sensible default job to point at; each caller passes the id it wants,
 * including an unsaved one when the test is about the foreign key.
 */
@Suppress("LongParameterList")
fun createContactEntity(
    jobId: UUID,
    id: UUID = UUID.randomUUID(),
    type: ContactType = ContactType.RECRUITER,
    name: String = "Jane Recruiter",
    email: String? = "jane@example.com",
    phone: String? = "+49 170 1234567",
    profileUrl: String? = "https://www.linkedin.com/in/jane-recruiter",
    lastContactedAt: LocalDate? = LocalDate.parse("2026-07-01"),
    notes: String? = "Reached out on LinkedIn; wants a CV.",
    createdAt: OffsetDateTime = contactFixtureTimestamp,
    updatedAt: OffsetDateTime = contactFixtureTimestamp,
): Contact =
    Contact(
        id = id,
        jobId = jobId,
        type = type,
        name = name,
        email = email,
        phone = phone,
        profileUrl = profileUrl,
        lastContactedAt = lastContactedAt,
        notes = notes,
        createdAt = createdAt,
        updatedAt = updatedAt,
    )

class FakeContactService : ContactService {
    lateinit var lastListedJobId: UUID
    lateinit var lastCreateJobId: UUID
    lateinit var lastCreateCommand: CreateContactCommand
    lateinit var lastUpdateJobId: UUID
    lateinit var lastUpdateContactId: UUID
    lateinit var lastUpdateCommand: UpdateContactCommand
    lateinit var lastDeleteJobId: UUID
    lateinit var lastDeleteContactId: UUID

    var listHandler: (UUID) -> List<Contact> = { jobId -> listOf(createContactEntity(jobId = jobId)) }

    var createHandler: (UUID, CreateContactCommand) -> Contact =
        { jobId, _ -> createContactEntity(jobId = jobId) }

    var updateHandler: (UUID, UUID, UpdateContactCommand) -> Contact =
        { jobId, contactId, _ -> createContactEntity(jobId = jobId, id = contactId) }

    var deleteHandler: (UUID, UUID) -> Unit = { _, _ -> }

    override fun listContacts(jobId: UUID): List<Contact> {
        lastListedJobId = jobId

        return listHandler(jobId)
    }

    override fun createContact(
        jobId: UUID,
        command: CreateContactCommand,
    ): Contact {
        lastCreateJobId = jobId
        lastCreateCommand = command

        return createHandler(jobId, command)
    }

    override fun updateContact(
        jobId: UUID,
        contactId: UUID,
        command: UpdateContactCommand,
    ): Contact {
        lastUpdateJobId = jobId
        lastUpdateContactId = contactId
        lastUpdateCommand = command

        return updateHandler(jobId, contactId, command)
    }

    override fun deleteContact(
        jobId: UUID,
        contactId: UUID,
    ) {
        lastDeleteJobId = jobId
        lastDeleteContactId = contactId
        deleteHandler(jobId, contactId)
    }
}
