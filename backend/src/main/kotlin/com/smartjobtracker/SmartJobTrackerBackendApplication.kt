package com.smartjobtracker

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class SmartJobTrackerBackendApplication

fun main(args: Array<String>) {
    runApplication<SmartJobTrackerBackendApplication>(*args)
}
