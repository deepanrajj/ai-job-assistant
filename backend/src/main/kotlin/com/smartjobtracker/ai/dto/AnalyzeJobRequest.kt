package com.smartjobtracker.ai.dto

import jakarta.validation.constraints.NotBlank

data class AnalyzeJobRequest(
    @field:NotBlank("Description must not be blank")
    val description: String,
)
