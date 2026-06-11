package com.smartjobtracker.testsupport

import tools.jackson.databind.ObjectMapper
import tools.jackson.databind.json.JsonMapper
import tools.jackson.module.kotlin.KotlinModule

fun createTestObjectMapper(): ObjectMapper =
    JsonMapper
        .builder()
        .addModule(KotlinModule.Builder().build())
        .build()
