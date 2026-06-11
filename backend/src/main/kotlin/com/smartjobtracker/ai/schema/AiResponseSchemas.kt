package com.smartjobtracker.ai.schema

object AiResponseSchemas {
    val analyzeJobSchema: Map<String, Any> =
        mapOf(
            "type" to "object",
            "additionalProperties" to false,
            "properties" to
                mapOf(
                    "summary" to
                        mapOf(
                            "type" to "string",
                        ),
                    "requiredSkills" to
                        mapOf(
                            "type" to "array",
                            "items" to
                                mapOf(
                                    "type" to "string",
                                ),
                        ),
                    "niceToHaveSkills" to
                        mapOf(
                            "type" to "array",
                            "items" to
                                mapOf(
                                    "type" to "string",
                                ),
                        ),
                    "seniority" to
                        mapOf(
                            "type" to "string",
                            "enum" to listOf("Junior", "Mid", "Senior", "Lead", "Unknown"),
                        ),
                    "prepTasks" to
                        mapOf(
                            "type" to "array",
                            "items" to
                                mapOf(
                                    "type" to "string",
                                ),
                        ),
                ),
            "required" to listOf("summary", "requiredSkills", "niceToHaveSkills", "seniority", "prepTasks"),
        )

    val askJobSchema: Map<String, Any> =
        mapOf(
            "type" to "object",
            "additionalProperties" to false,
            "properties" to
                mapOf(
                    "answer" to
                        mapOf(
                            "type" to "string",
                        ),
                ),
            "required" to listOf("answer"),
        )
}
