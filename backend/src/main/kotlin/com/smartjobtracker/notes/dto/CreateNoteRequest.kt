package com.smartjobtracker.notes.dto

import com.smartjobtracker.notes.command.CreateNoteCommand
import jakarta.validation.constraints.NotBlank

data class CreateNoteRequest(
    @field:NotBlank(message = "Body must not be blank")
    val body: String,
)

fun CreateNoteRequest.toCommand(): CreateNoteCommand =
    CreateNoteCommand(
        body = body,
    )
