package com.smartjobtracker.contacts.dto

import com.smartjobtracker.contacts.ContactType
import com.smartjobtracker.contacts.command.UpdateContactCommand
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import tools.jackson.databind.annotation.JsonDeserialize
import java.time.LocalDate

/**
 * Update request payload. A full replacement, the same shape as create:
 * every field must be sent, though an optional one may be sent blank or
 * null and is stored as null either way, per `trimToNullIfBlank()`,
 * which runs as the body is read (see `TrimToNullStringDeserializer`) so
 * validation sees the trimmed value.
 */
data class UpdateContactRequest(
    val type: ContactType,
    @field:NotBlank(message = NAME_BLANK_MESSAGE)
    @field:Size(max = MAX_NAME_LENGTH, message = NAME_SIZE_MESSAGE)
    val name: String,
    @JsonDeserialize(using = TrimToNullStringDeserializer::class)
    @field:Email(message = EMAIL_FORMAT_MESSAGE)
    @field:Size(max = MAX_EMAIL_LENGTH, message = EMAIL_SIZE_MESSAGE)
    val email: String?,
    @JsonDeserialize(using = TrimToNullStringDeserializer::class)
    @field:Size(max = MAX_PHONE_LENGTH, message = PHONE_SIZE_MESSAGE)
    val phone: String?,
    @JsonDeserialize(using = TrimToNullStringDeserializer::class)
    @field:Pattern(regexp = PROFILE_URL_PATTERN, message = PROFILE_URL_SCHEME_MESSAGE)
    @field:Size(max = MAX_PROFILE_URL_LENGTH, message = PROFILE_URL_SIZE_MESSAGE)
    val profileUrl: String?,
    val lastContactedAt: LocalDate?,
    @JsonDeserialize(using = TrimToNullStringDeserializer::class)
    @field:Size(max = MAX_NOTES_LENGTH, message = NOTES_SIZE_MESSAGE)
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
