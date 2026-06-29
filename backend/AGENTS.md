# AGENTS.md - Backend

Scope: this file governs `backend/`. The root `../AGENTS.md` still
applies. If the two files disagree, this file wins for backend code and
`../docs/context.md` wins for product intent.

Current stack:

```text
Kotlin
Spring Boot
Spring MVC controllers
WebClient for outbound OpenAI calls
Bean Validation
Springdoc OpenAPI
ktlint
detekt
JaCoCo
JUnit 5
AssertJ
```

## 1. Structure

- Keep backend package root under `com.smartjobtracker`.
- Group production code by domain package, such as `ai`, `jobs`,
  `tasks`, `notes`, `timeline`, `api.error`, and `config`.
- Keep controller request and response models in DTO/model files, not
  inline inside controllers.
- Keep external provider request/response models separate from public
  API DTOs.
- Keep test support under `src/test/kotlin/com/smartjobtracker/testsupport`.

## 2. Kotlin Style

- Prefer `val` over `var`.
- Avoid `!!`.
- Avoid wildcard imports.
- Avoid generic `Exception` catches unless they are the final boundary
  and converted into a typed API error.
- Prefer expression bodies for short functions only when they remain
  readable and satisfy line-length checks.
- Extract constants for magic numbers and repeated literal values.

## 3. API And Error Handling

- Use Spring MVC controllers for inbound HTTP APIs.
- Use Bean Validation annotations on request DTOs.
- Return consistent error JSON through `ApiExceptionHandler`.
- Throw `ApiException` or a domain-specific exception converted by the
  global handler.
- Do not throw plain `Exception` or leak provider errors directly to
  callers.
- Keep OpenAPI documentation generated from controllers and DTOs; add
  annotations only when they clarify generated docs.

## 4. Persistence

- When persistence is introduced, use Flyway migrations as schema truth.
- Add new migrations instead of editing existing migrations.
- Keep JPA entities and API DTOs separate.
- Repository methods should encode ownership/user scoping once
  authentication exists.

## 5. AI Provider Boundary

- Backend owns OpenAI communication.
- Frontend must not call OpenAI directly.
- Do not log raw job descriptions, raw prompts, API keys, or full AI
  responses.
- Convert provider failures into typed API errors with user-safe
  messages.

## 6. Tests

- Add unit tests for service, mapper, and utility behavior.
- Add controller tests for request validation, successful responses, and
  error responses.
- Add integration tests when behavior crosses persistence, API, or
  external boundary seams.
- Prefer fakes/test factories for simple collaborators.
- Use mocks only when they make the test clearer than a fake.
- Keep JaCoCo exclusions deliberate and narrow.
- Use `org.junit.jupiter.api.Test` for all test annotations.
- Use AssertJ (`org.assertj.core.api.Assertions`) for all assertions.
  Do not use `kotlin.test` assertions.

## 7. Verification

Run backend verification after backend behavior changes:

```bash
npm run backend:verify
```

For focused iteration:

```bash
npm run backend:format:check
npm run backend:lint
npm run backend:test:coverage
```
