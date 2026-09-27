package com.smartjobtracker.contacts

import com.smartjobtracker.api.error.ApiErrorCode
import com.smartjobtracker.api.error.ApiException
import com.smartjobtracker.contacts.command.CreateContactCommand
import com.smartjobtracker.contacts.command.UpdateContactCommand
import com.smartjobtracker.jobs.JobService
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Clock
import java.time.OffsetDateTime
import java.util.UUID

interface ContactService {
    fun listContacts(jobId: UUID): List<Contact>

    fun createContact(
        jobId: UUID,
        command: CreateContactCommand,
    ): Contact

    fun updateContact(
        jobId: UUID,
        contactId: UUID,
        command: UpdateContactCommand,
    ): Contact

    fun deleteContact(
        jobId: UUID,
        contactId: UUID,
    )
}

@Service
class DefaultContactService(
    private val jobService: JobService,
    private val contactRepository: ContactRepository,
    private val clock: Clock,
) : ContactService {
    @Transactional
    override fun listContacts(jobId: UUID): List<Contact> {
        jobService.getJob(jobId)

        return contactRepository.findAllByJobIdOrderByCreatedAtAscIdAsc(jobId)
    }

    @Transactional
    override fun createContact(
        jobId: UUID,
        command: CreateContactCommand,
    ): Contact {
        jobService.getJob(jobId)

        val timestamp = now()
        val contact =
            Contact(
                id = UUID.randomUUID(),
                jobId = jobId,
                type = command.type,
                name = command.name,
                email = command.email,
                phone = command.phone,
                profileUrl = command.profileUrl,
                lastContactedAt = command.lastContactedAt,
                notes = command.notes,
                createdAt = timestamp,
                updatedAt = timestamp,
            )
        return contactRepository.save(contact)
    }

    @Transactional
    override fun updateContact(
        jobId: UUID,
        contactId: UUID,
        command: UpdateContactCommand,
    ): Contact {
        jobService.getJob(jobId)

        val contact = contactRepository.findByIdAndJobId(id = contactId, jobId = jobId) ?: throw contactNotFound()
        contact.type = command.type
        contact.name = command.name
        contact.email = command.email
        contact.phone = command.phone
        contact.profileUrl = command.profileUrl
        contact.lastContactedAt = command.lastContactedAt
        contact.notes = command.notes
        contact.updatedAt = now()
        return contact
    }

    @Transactional
    override fun deleteContact(
        jobId: UUID,
        contactId: UUID,
    ) {
        jobService.getJob(jobId)

        val contact = contactRepository.findByIdAndJobId(id = contactId, jobId = jobId) ?: throw contactNotFound()
        contactRepository.delete(contact)
    }

    private fun now(): OffsetDateTime = OffsetDateTime.now(clock)

    private fun contactNotFound(): ApiException =
        ApiException(
            status = HttpStatus.NOT_FOUND,
            errorCode = ApiErrorCode.CONTACT_NOT_FOUND,
            message = "Contact not found.",
        )
}
