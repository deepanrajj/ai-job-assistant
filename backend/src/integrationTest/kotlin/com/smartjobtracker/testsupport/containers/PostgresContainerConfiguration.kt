package com.smartjobtracker.testsupport.containers

import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.testcontainers.containers.PostgreSQLContainer

private const val POSTGRES_IMAGE = "postgres:16"

/**
 * One PostgreSQL for the whole JVM.
 *
 * A container declared only as a `@Bean` is scoped to its Spring
 * context, and test classes that differ in their annotations get
 * different contexts: adding `@AutoConfigureMockMvc` alone is enough.
 * Each context would then start its own database, so the cost grows
 * with the number of slice combinations rather than staying flat. That
 * was measured, not assumed - before this object existed, two test
 * classes produced two containers.
 *
 * A Kotlin `object` initialises on first access, so the container
 * starts when the first context asks for it and is reused by every
 * context after that.
 */
object SharedPostgresContainer {
    val instance: PostgreSQLContainer<*> =
        PostgreSQLContainer(POSTGRES_IMAGE).apply { start() }
}

/**
 * Hands the shared container to Spring.
 *
 * The image is pinned to the major version the product deploys, from
 * `infra/k8s/local/postgres-deployment.yaml`. Testing against a
 * different major would prove the migrations work on a database nobody
 * runs.
 *
 * `@ServiceConnection` is what removes the usual boilerplate: Spring
 * Boot reads the container's host, port, and credentials once it has
 * started and supplies them to the datasource, so no JDBC URL has to be
 * written down or kept in step with the container.
 *
 * `destroyMethod = ""` stops Spring from calling `stop()` when a
 * context closes. Without it, one context being evicted from Spring's
 * context cache would shut down the database that other contexts are
 * still using. Testcontainers' own reaper removes the container when
 * the JVM exits.
 */
@TestConfiguration(proxyBeanMethods = false)
class PostgresContainerConfiguration {
    @Bean(destroyMethod = "")
    @ServiceConnection
    fun postgresContainer(): PostgreSQLContainer<*> = SharedPostgresContainer.instance
}
