package com.smartjobtracker.notes.command

data class CreateNoteCommand(
    val body: String,
)

data class UpdateNoteCommand(
    val body: String,
)
