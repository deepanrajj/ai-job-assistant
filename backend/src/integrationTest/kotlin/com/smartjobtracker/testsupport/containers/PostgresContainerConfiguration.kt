package com.smartjobtracker.testsupport.containers

import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.testcontainers.containers.PostgreSQLContainer

/**
 * Starts one real PostgreSQL for the integration tests.
 *
 * The image is pinned to the major version the product deploys, from
 * `infra/k8s/local/postgres-deployment.yaml`. Testing against a
 * different major would prove the migrations work on a database nobody
 * runs.
 *
 * `@ServiceConnection` is what removes the usual boilerplate: Spring
 * Boot reads the container's host, port, and credentials once it has
 * started and supplies them to the datasource, so no property has to be
 * written down or kept in step with the container.
 *
 * The container is a Spring bean, so it starts with the application
 * context and stops with it. Because Spring caches contexts across test
 * classes, every class importing this configuration shares one
 * container rather than paying to start its own.
 */
@TestConfiguration(proxyBeanMethods = false)
class PostgresContainerConfiguration {
    @Bean
    @ServiceConnection
    fun postgresContainer(): PostgreSQLContainer<*> = PostgreSQLContainer(POSTGRES_IMAGE)

    private companion object {
        const val POSTGRES_IMAGE = "postgres:16"
    }
}
