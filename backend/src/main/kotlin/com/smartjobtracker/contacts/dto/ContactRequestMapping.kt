package com.smartjobtracker.contacts.dto

import tools.jackson.core.JsonParser
import tools.jackson.databind.DeserializationContext
import tools.jackson.databind.deser.std.StdScalarDeserializer

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

/**
 * Applies `trimToNullIfBlank()` while the request body is being read, so
 * Bean Validation sees the same value `toCommand()` stores. Without it,
 * `@Email` and `@Pattern` checked the raw value: a whitespace-only email
 * or a padded `" jane@example.com "` was rejected with a 400 even though
 * the field would have been stored as null or trimmed, for any client
 * that does not trim before sending.
 *
 * A JSON `null` never reaches this deserializer; Jackson maps it to null
 * directly. Any other token is read by the default `String` handling
 * first, so coercion rules and error messages stay unchanged.
 */
internal class TrimToNullStringDeserializer : StdScalarDeserializer<String>(String::class.java) {
    override fun deserialize(
        p: JsonParser,
        ctxt: DeserializationContext,
    ): String? = ctxt.readValue(p, String::class.java).trimToNullIfBlank()
}

/**
 * Trims a required text field while the request body is being read, so
 * `@Size` checks the value `toCommand()` stores rather than the padded
 * one. Unlike `TrimToNullStringDeserializer`, a blank result stays `""`
 * instead of becoming null, so `@NotBlank` still rejects it with its own
 * message. As with `TrimToNullStringDeserializer`, a JSON `null` never
 * reaches it, so the value read here is never null.
 */
internal class TrimStringDeserializer : StdScalarDeserializer<String>(String::class.java) {
    override fun deserialize(
        p: JsonParser,
        ctxt: DeserializationContext,
    ): String = ctxt.readValue(p, String::class.java).trim()
}
