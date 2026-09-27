package com.smartjobtracker.contacts

import com.smartjobtracker.api.error.ApiErrorResponse
import com.smartjobtracker.contacts.dto.ContactResponse
import com.smartjobtracker.contacts.dto.CreateContactRequest
import com.smartjobtracker.contacts.dto.UpdateContactRequest
import com.smartjobtracker.contacts.dto.toCommand
import com.smartjobtracker.contacts.dto.toResponse
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

private const val CONTACT_NOT_FOUND_DESCRIPTION = "Job or contact not found"

private const val VALIDATION_FAILED_DESCRIPTION = "Request validation failed"

@RestController
@RequestMapping("/jobs/{jobId}/contacts")
class ContactController(
    private val contactService: ContactService,
) {
    @GetMapping
    @ApiResponse(
        responseCode = "404",
        description = CONTACT_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun listContacts(
        @PathVariable jobId: UUID,
    ): List<ContactResponse> = contactService.listContacts(jobId).map { it.toResponse() }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(
        responseCode = "400",
        description = VALIDATION_FAILED_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun createContact(
        @PathVariable jobId: UUID,
        @Valid @RequestBody request: CreateContactRequest,
    ): ContactResponse = contactService.createContact(jobId, request.toCommand()).toResponse()

    @PutMapping("/{contactId}")
    @ApiResponse(
        responseCode = "400",
        description = VALIDATION_FAILED_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    @ApiResponse(
        responseCode = "404",
        description = CONTACT_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun updateContact(
        @PathVariable jobId: UUID,
        @PathVariable contactId: UUID,
        @Valid @RequestBody request: UpdateContactRequest,
    ): ContactResponse =
        contactService
            .updateContact(jobId = jobId, contactId = contactId, command = request.toCommand())
            .toResponse()

    @DeleteMapping("/{contactId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(
        responseCode = "404",
        description = CONTACT_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun deleteContact(
        @PathVariable jobId: UUID,
        @PathVariable contactId: UUID,
    ) {
        contactService.deleteContact(jobId = jobId, contactId = contactId)
    }
}
