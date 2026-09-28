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
 * A profile URL must be blank (not set, including whitespace-only) or
 * start with `http://` or `https://`. It is rendered as a link on the
 * frontend, and a bare `URL` parse there would accept schemes such as
 * `javascript:`, so the scheme is checked here rather than trusting that
 * parse alone.
 *
 * The scheme is matched case-insensitively (`(?i:...)`), as URL schemes
 * are, and as the frontend's `isValidProfileUrl()` in `contacts.utils.ts`
 * already does with its `/i` flag - otherwise a pasted
 * `HTTPS://www.linkedin.com/...` passed the form and then failed here.
 *
 * `^\s*$` (rather than `^$`) treats a whitespace-only value the same as
 * an empty one. `TrimToNullStringDeserializer` normally turns such a value
 * into null before validation runs, so this is a second line of defense
 * for any path that binds the DTO without it.
 */
internal const val PROFILE_URL_PATTERN = "^\\s*$|^(?i:https?)://.*"

/**
 * Validation messages shared between `CreateContactRequest` and
 * `UpdateContactRequest`, so a wording or limit change made to one
 * cannot silently drift from the other - the two DTOs otherwise
 * duplicate every field and annotation by hand, since a create and an
 * update payload are still distinct types.
 */
internal const val NAME_BLANK_MESSAGE = "Name must not be blank"

internal const val NAME_SIZE_MESSAGE = "Name must be at most 255 characters"

internal const val EMAIL_FORMAT_MESSAGE = "Email must be a valid address"

internal const val EMAIL_SIZE_MESSAGE = "Email must be at most 255 characters"

internal const val PHONE_SIZE_MESSAGE = "Phone must be at most 50 characters"

internal const val PROFILE_URL_SCHEME_MESSAGE = "Profile URL must start with http:// or https://"

internal const val PROFILE_URL_SIZE_MESSAGE = "Profile URL must be at most 2048 characters"

internal const val NOTES_SIZE_MESSAGE = "Notes must be at most 5000 characters"
