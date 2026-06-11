package com.smartjobtracker.ai

import com.smartjobtracker.ai.client.OpenAiRequest

interface AiStructuredResponseClient {
    fun createStructuredResponse(request: OpenAiRequest): String
}
