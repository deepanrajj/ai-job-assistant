package com.smartjobtracker.contacts.dto

import com.smartjobtracker.contacts.ContactType
import com.smartjobtracker.contacts.command.CreateContactCommand
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import tools.jackson.databind.annotation.JsonDeserialize
import java.time.LocalDate

/**
 * Create request payload. `type` and `name` are required; every other
 * field is optional and a blank value is stored as null, per
 * `trimToNullIfBlank()`, which runs as the body is read (see
 * `TrimToNullStringDeserializer`) so validation sees the trimmed value.
 */
data class CreateContactRequest(
    val type: ContactType,
    @JsonDeserialize(using = TrimStringDeserializer::class)
    @field:NotBlank(message = NAME_BLANK_MESSAGE)
    @field:Size(max = MAX_NAME_LENGTH, message = NAME_SIZE_MESSAGE)
    val name: String,
    @JsonDeserialize(using = TrimToNullStringDeserializer::class)
    @field:Email(message = EMAIL_FORMAT_MESSAGE)
    @field:Size(max = MAX_EMAIL_LENGTH, message = EMAIL_SIZE_MESSAGE)
    val email: String? = null,
    @JsonDeserialize(using = TrimToNullStringDeserializer::class)
    @field:Size(max = MAX_PHONE_LENGTH, message = PHONE_SIZE_MESSAGE)
    val phone: String? = null,
    @JsonDeserialize(using = TrimToNullStringDeserializer::class)
    @field:Pattern(regexp = PROFILE_URL_PATTERN, message = PROFILE_URL_SCHEME_MESSAGE)
    @field:Size(max = MAX_PROFILE_URL_LENGTH, message = PROFILE_URL_SIZE_MESSAGE)
    val profileUrl: String? = null,
    @field:FourDigitYear(message = LAST_CONTACTED_AT_YEAR_MESSAGE)
    val lastContactedAt: LocalDate? = null,
    @JsonDeserialize(using = TrimToNullStringDeserializer::class)
    @field:Size(max = MAX_NOTES_LENGTH, message = NOTES_SIZE_MESSAGE)
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
