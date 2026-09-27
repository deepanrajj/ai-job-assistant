package com.smartjobtracker.contacts.command

import com.smartjobtracker.contacts.ContactType
import java.time.LocalDate

data class CreateContactCommand(
    val type: ContactType,
    val name: String,
    val email: String? = null,
    val phone: String? = null,
    val profileUrl: String? = null,
    val lastContactedAt: LocalDate? = null,
    val notes: String? = null,
)

data class UpdateContactCommand(
    val type: ContactType,
    val name: String,
    val email: String?,
    val phone: String?,
    val profileUrl: String?,
    val lastContactedAt: LocalDate?,
    val notes: String?,
)
