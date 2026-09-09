import java.math.BigDecimal

plugins {
    kotlin("jvm") version "2.2.20"
    kotlin("plugin.spring") version "2.2.20"
    kotlin("plugin.jpa") version "2.2.20"
    id("org.springframework.boot") version "4.0.4"
    id("io.spring.dependency-management") version "1.1.7"
    id("org.jlleitschuh.gradle.ktlint") version "13.1.0"
    id("dev.detekt") version "2.0.0-alpha.1"
    jacoco
}

group = "com.smartjobtracker"
version = "0.1.0-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

/**
 * Integration tests run against a real PostgreSQL container and live in
 * their own source set so `test` stays hermetic: `npm run backend:verify`
 * needs no Docker and pays no container startup, which is what keeps it
 * worth running constantly.
 *
 * It also keeps the JaCoCo gate honest. Coverage is measured from `test`
 * alone, so a container exercising more code paths cannot push the
 * number towards 100 per cent without anyone writing a unit test.
 *
 * Only the compiled `test` classes are on the classpath, not the `test`
 * resources. Fixtures such as `createJobEntity` are reusable, while
 * `src/test/resources/application.properties`, which points the
 * datasource at H2, stays out of the way of the container. Note that
 * Kotlin `internal` members do not cross a source-set boundary, so
 * fixture values declared `internal` are not visible here.
 */
sourceSets {
    create("integrationTest") {
        compileClasspath += sourceSets["main"].output + sourceSets["test"].output.classesDirs
        runtimeClasspath += sourceSets["main"].output + sourceSets["test"].output.classesDirs
    }
}

configurations["integrationTestImplementation"]
    .extendsFrom(configurations["testImplementation"])

configurations["integrationTestRuntimeOnly"]
    .extendsFrom(configurations["testRuntimeOnly"])

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.3")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("tools.jackson.module:jackson-module-kotlin")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-flyway")
    runtimeOnly("org.postgresql:postgresql")
    runtimeOnly("org.flywaydb:flyway-database-postgresql")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    testImplementation("org.springframework.boot:spring-boot-starter-validation-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webflux-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testRuntimeOnly("com.h2database:h2")
    // Versions come from Spring Boot's dependency management, which pins
    // Testcontainers at 2.x. Most examples online target 1.x.
    "integrationTestImplementation"("org.springframework.boot:spring-boot-testcontainers")
    "integrationTestImplementation"("org.testcontainers:testcontainers-postgresql")
    "integrationTestImplementation"("org.testcontainers:testcontainers-junit-jupiter")
    "integrationTestRuntimeOnly"("org.postgresql:postgresql")
}

ktlint {
    version.set("1.7.1")
}

detekt {
    buildUponDefaultConfig = true
    allRules = false
}

val jacocoClassExclusions =
    listOf(
        "**/SmartJobTrackerBackendApplication*",
        "**/config/**",
        "**/ai/client/**",
        "**/ai/dto/**",
        "**/api/error/ApiErrorCode*",
        "**/api/error/ApiErrorResponse*",
        "**/api/error/ApiFieldError*",
        "**/api/error/ApiException.class",
    )

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.test {
    finalizedBy(tasks.jacocoTestReport)
}

/**
 * Deliberately not wired into `tasks.check` and not registered with
 * JaCoCo. Running it requires Docker, so making `check` depend on it
 * would put a Docker requirement on every `npm run backend:verify`.
 * CI invokes it as its own step instead.
 *
 * `useJUnitPlatform()` is already applied to every `Test` task by the
 * `tasks.withType<Test>` block above, which applies to tasks registered
 * later as well.
 */
tasks.register<Test>("integrationTest") {
    description = "Runs tests against a real PostgreSQL container."
    group = "verification"
    testClassesDirs = sourceSets["integrationTest"].output.classesDirs
    classpath = sourceSets["integrationTest"].runtimeClasspath
    shouldRunAfter(tasks.test)
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)

    classDirectories.setFrom(
        files(
            classDirectories.files.map {
                fileTree(it) {
                    exclude(jacocoClassExclusions)
                }
            },
        ),
    )

    reports {
        html.required.set(true)
        xml.required.set(true)
        csv.required.set(false)
    }
}

tasks.jacocoTestCoverageVerification {
    dependsOn(tasks.test)

    classDirectories.setFrom(
        files(
            classDirectories.files.map {
                fileTree(it) {
                    exclude(jacocoClassExclusions)
                }
            },
        ),
    )

    violationRules {
        rule {
            limit {
                counter = "LINE"
                value = "COVEREDRATIO"
                minimum = BigDecimal("1.00")
            }

            limit {
                counter = "BRANCH"
                value = "COVEREDRATIO"
                minimum = BigDecimal("1.00")
            }
        }
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestCoverageVerification)
}
