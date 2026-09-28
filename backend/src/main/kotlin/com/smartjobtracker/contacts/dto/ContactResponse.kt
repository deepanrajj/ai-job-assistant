package com.smartjobtracker.contacts.dto

import com.smartjobtracker.contacts.Contact
import com.smartjobtracker.contacts.ContactType
import java.time.LocalDate
import java.time.OffsetDateTime
import java.util.UUID

/**
 * Public API representation of a saved contact. Deliberately omits
 * `jobId`: every route already carries it in the path, so repeating it
 * in the body would be redundant.
 */
data class ContactResponse(
    val id: UUID,
    val type: ContactType,
    val name: String,
    val email: String?,
    val phone: String?,
    val profileUrl: String?,
    val lastContactedAt: LocalDate?,
    val notes: String?,
    val createdAt: OffsetDateTime,
    val updatedAt: OffsetDateTime,
)

fun Contact.toResponse() =
    ContactResponse(
        id = id,
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
