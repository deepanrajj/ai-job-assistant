package com.smartjobtracker.ai.dto

data class AnalyzeJobResponse(
    val summary: String,
    val requiredSkills: List<String>,
    val niceToHaveSkills: List<String>,
    val seniority: String,
    val prepTasks: List<String>,
)
