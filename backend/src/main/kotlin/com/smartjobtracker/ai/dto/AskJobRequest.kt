package com.smartjobtracker.ai.dto

import jakarta.validation.constraints.NotBlank

data class AskJobRequest(
    @field:NotBlank("Description must not be blank")
    val description: String,
    @field:NotBlank("Question must not be blank")
    val question: String,
)
