package com.smartjobtracker.notes

import com.smartjobtracker.api.error.ApiErrorResponse
import com.smartjobtracker.notes.dto.CreateNoteRequest
import com.smartjobtracker.notes.dto.NoteResponse
import com.smartjobtracker.notes.dto.UpdateNoteRequest
import com.smartjobtracker.notes.dto.toCommand
import com.smartjobtracker.notes.dto.toResponse
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

private const val NOTE_NOT_FOUND_DESCRIPTION = "Job or note not found"

private const val VALIDATION_FAILED_DESCRIPTION = "Request validation failed"

@RestController
@RequestMapping("/jobs/{jobId}/notes")
class NoteController(
    private val noteService: NoteService,
) {
    @GetMapping
    @ApiResponse(
        responseCode = "404",
        description = NOTE_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun listNotes(
        @PathVariable jobId: UUID,
    ): List<NoteResponse> = noteService.listNotes(jobId).map { it.toResponse() }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @ApiResponse(
        responseCode = "400",
        description = VALIDATION_FAILED_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun createNote(
        @PathVariable jobId: UUID,
        @Valid @RequestBody request: CreateNoteRequest,
    ): NoteResponse = noteService.createNote(jobId, request.toCommand()).toResponse()

    @PutMapping("/{noteId}")
    @ApiResponse(
        responseCode = "400",
        description = VALIDATION_FAILED_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    @ApiResponse(
        responseCode = "404",
        description = NOTE_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun updateNote(
        @PathVariable jobId: UUID,
        @PathVariable noteId: UUID,
        @Valid @RequestBody request: UpdateNoteRequest,
    ): NoteResponse = noteService.updateNote(jobId = jobId, noteId = noteId, command = request.toCommand()).toResponse()

    @DeleteMapping("/{noteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @ApiResponse(
        responseCode = "404",
        description = NOTE_NOT_FOUND_DESCRIPTION,
        content = [Content(schema = Schema(implementation = ApiErrorResponse::class))],
    )
    fun deleteNote(
        @PathVariable jobId: UUID,
        @PathVariable noteId: UUID,
    ) {
        noteService.deleteNote(jobId = jobId, noteId = noteId)
    }
}
