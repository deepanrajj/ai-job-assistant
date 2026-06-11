package com.smartjobtracker.ai.client

data class OpenAiRequest(
    val model: String,
    val input: List<OpenAiInputMessage>,
    val text: OpenAiText,
)

data class OpenAiInputMessage(
    val role: String,
    val content: List<OpenAiInputContent>,
)

data class OpenAiInputContent(
    val type: String = "input_text",
    val text: String,
)

data class OpenAiText(
    val format: OpenAiTextFormat,
)

data class OpenAiTextFormat(
    val type: String = "json_schema",
    val name: String,
    val schema: Map<String, Any>,
    val strict: Boolean = true,
)

data class OpenAiResponse(
    val output: List<OpenAiOutputItem> = emptyList(),
)

data class OpenAiOutputItem(
    val type: String? = null,
    val content: List<OpenAiContentItem> = emptyList(),
)

data class OpenAiContentItem(
    val type: String? = null,
    val text: String? = null,
)
