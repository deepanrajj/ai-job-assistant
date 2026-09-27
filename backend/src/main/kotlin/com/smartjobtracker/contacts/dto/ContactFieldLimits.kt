package com.smartjobtracker.contacts.dto

/**
 * Request field limits mirroring the `contacts` table columns created in
 * `V7__create_contacts_table.sql`. Keeping them aligned means oversized
 * input is rejected as a validation error instead of failing at the
 * database and surfacing as an unexpected server error.
 */
internal const val MAX_NAME_LENGTH = 255

internal const val MAX_EMAIL_LENGTH = 255

internal const val MAX_PHONE_LENGTH = 50

internal const val MAX_PROFILE_URL_LENGTH = 2048

/**
 * `notes` is `TEXT` in the database, so nothing forces this limit at the
 * schema level; it exists only to keep one contact's notes from growing
 * without bound.
 */
internal const val MAX_NOTES_LENGTH = 5000

/**
 * A profile URL must be blank (not set) or start with `http://` or
 * `https://`. It is rendered as a link on the frontend, and a bare `URL`
 * parse there would accept schemes such as `javascript:`, so the scheme
 * is checked here rather than trusting that parse alone.
 */
internal const val PROFILE_URL_PATTERN = "^$|^https?://.*"
