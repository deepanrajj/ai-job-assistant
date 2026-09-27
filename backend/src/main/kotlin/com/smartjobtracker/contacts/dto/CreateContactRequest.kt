package com.smartjobtracker.contacts.dto

import com.smartjobtracker.contacts.ContactType
import com.smartjobtracker.contacts.command.CreateContactCommand
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.LocalDate

/**
 * Create request payload. `type` and `name` are required; every other
 * field is optional and a blank value is stored as null, per
 * `trimToNullIfBlank()`.
 */
data class CreateContactRequest(
    val type: ContactType,
    @field:NotBlank(message = "Name must not be blank")
    @field:Size(max = MAX_NAME_LENGTH, message = "Name must be at most 255 characters")
    val name: String,
    @field:Email(message = "Email must be a valid address")
    @field:Size(max = MAX_EMAIL_LENGTH, message = "Email must be at most 255 characters")
    val email: String? = null,
    @field:Size(max = MAX_PHONE_LENGTH, message = "Phone must be at most 50 characters")
    val phone: String? = null,
    @field:Pattern(
        regexp = PROFILE_URL_PATTERN,
        message = "Profile URL must start with http:// or https://",
    )
    @field:Size(max = MAX_PROFILE_URL_LENGTH, message = "Profile URL must be at most 2048 characters")
    val profileUrl: String? = null,
    val lastContactedAt: LocalDate? = null,
    @field:Size(max = MAX_NOTES_LENGTH, message = "Notes must be at most 5000 characters")
    val notes: String? = null,
)

fun CreateContactRequest.toCommand(): CreateContactCommand =
    CreateContactCommand(
        type = type,
        name = name.trim(),
        email = email.trimToNullIfBlank(),
        phone = phone.trimToNullIfBlank(),
        profileUrl = profileUrl.trimToNullIfBlank(),
        lastContactedAt = lastContactedAt,
        notes = notes.trimToNullIfBlank(),
    )
