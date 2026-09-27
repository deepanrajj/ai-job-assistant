package com.smartjobtracker.contacts.dto

import com.smartjobtracker.contacts.ContactType
import com.smartjobtracker.contacts.command.UpdateContactCommand
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.LocalDate

/**
 * Update request payload. A full replacement, the same shape as create:
 * every field must be sent, though an optional one may be sent blank or
 * null and is stored as null either way, per `trimToNullIfBlank()`.
 */
data class UpdateContactRequest(
    val type: ContactType,
    @field:NotBlank(message = "Name must not be blank")
    @field:Size(max = MAX_NAME_LENGTH, message = "Name must be at most 255 characters")
    val name: String,
    @field:Email(message = "Email must be a valid address")
    @field:Size(max = MAX_EMAIL_LENGTH, message = "Email must be at most 255 characters")
    val email: String?,
    @field:Size(max = MAX_PHONE_LENGTH, message = "Phone must be at most 50 characters")
    val phone: String?,
    @field:Pattern(
        regexp = PROFILE_URL_PATTERN,
        message = "Profile URL must start with http:// or https://",
    )
    @field:Size(max = MAX_PROFILE_URL_LENGTH, message = "Profile URL must be at most 2048 characters")
    val profileUrl: String?,
    val lastContactedAt: LocalDate?,
    @field:Size(max = MAX_NOTES_LENGTH, message = "Notes must be at most 5000 characters")
    val notes: String?,
)

fun UpdateContactRequest.toCommand(): UpdateContactCommand =
    UpdateContactCommand(
        type = type,
        name = name.trim(),
        email = email.trimToNullIfBlank(),
        phone = phone.trimToNullIfBlank(),
        profileUrl = profileUrl.trimToNullIfBlank(),
        lastContactedAt = lastContactedAt,
        notes = notes.trimToNullIfBlank(),
    )
