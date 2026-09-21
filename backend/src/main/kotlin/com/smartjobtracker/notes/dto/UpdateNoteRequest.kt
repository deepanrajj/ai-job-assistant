package com.smartjobtracker.notes.dto

import com.smartjobtracker.notes.command.UpdateNoteCommand
import jakarta.validation.constraints.NotBlank

data class UpdateNoteRequest(
    @field:NotBlank(message = "Body must not be blank")
    val body: String,
)

fun UpdateNoteRequest.toCommand(): UpdateNoteCommand =
    UpdateNoteCommand(
        body = body,
    )
