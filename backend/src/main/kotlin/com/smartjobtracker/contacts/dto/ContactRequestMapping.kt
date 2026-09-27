package com.smartjobtracker.contacts.dto

/**
 * Trims a request field and converts a blank result to null, so a blank
 * optional field means the same thing as an omitted one. Used by both
 * `CreateContactRequest.toCommand()` and `UpdateContactRequest.toCommand()`
 * for every optional text field: `email`, `phone`, `profileUrl`, and
 * `notes`.
 *
 * @return the trimmed value, or null when it was blank.
 */
internal fun String?.trimToNullIfBlank(): String? {
    val trimmed = this?.trim()

    return if (trimmed.isNullOrBlank()) null else trimmed
}
