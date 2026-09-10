# Bug 002 - A Non-UUID Path Id Returns 500 Instead Of 400

Status: Fixed
Severity: P2
Reported: task 020 branch review

## Instructions

Read these files before starting (paths are relative to the created
file in `tasks/bugs/`, not to this template):

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../backend/AGENTS.md`

Follow `AGENTS.md` exactly. Fix this defect only. Do not expand scope
beyond this file.

## Symptom

- Any `/api/jobs/{id}` request whose id is not a well-formed UUID
  answers `500 INTERNAL_ERROR`.
- A well-formed UUID that does not exist correctly answers
  `404 JOB_NOT_FOUND`, so the two cases are indistinguishable to a
  client only by status code, and the wrong one is the server's fault.

## Reproduction

Against a running stack (`npm run dev:compose`):

1. `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:30080/api/jobs/not-a-uuid`
   prints `500`.
2. `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:30080/api/jobs/123`
   prints `500`.
3. `curl -s http://localhost:30080/api/jobs/6d58e422-3f47-4fd3-b08c-84b3a75347fc`
   prints `{"code":"JOB_NOT_FOUND",...}` with `404`.

Steps 1 and 2 return:

```json
{"code":"INTERNAL_ERROR","message":"Unexpected server error.","fieldErrors":[]}
```

Confirmed on the Compose stack during the task 020 review, not inferred.

## Expected And Actual

- Expected: a malformed path id is a client error. `400`, with a typed
  code, the way a malformed body already produces `MALFORMED_REQUEST`.
- Actual: `500 INTERNAL_ERROR`, the same response the API gives when
  something genuinely broke server-side.

## Root Cause

`JobController` declares the path variable as a `UUID`:

- `backend/src/main/kotlin/com/smartjobtracker/jobs/JobController.kt:44`,
  `:70` and `:82` all take `@PathVariable id: UUID`.

Spring converts the path segment to `UUID` before the handler runs. When
that conversion fails it raises a type-mismatch exception
(`MethodArgumentTypeMismatchException`, a `TypeMismatchException`
subclass). `ApiExceptionHandler` has handlers for `ApiException`,
`MethodArgumentNotValidException` and `HttpMessageNotReadableException`,
but none for that, so it falls through to the catch-all at
`backend/src/main/kotlin/com/smartjobtracker/api/error/ApiExceptionHandler.kt:55`.

The exact exception type was stated from Spring's documented conversion
behaviour and the observed fall-through rather than from a stack trace,
because the catch-all logs nothing. **Confirmed during the fix:** a
handler for `MethodArgumentTypeMismatchException` catches it, so the
parent `TypeMismatchException` was not needed.

### A second problem in the same handler

`handleUnexpectedException()` takes no exception parameter and logs
nothing. Every genuine 500 is therefore silent: there is no stack trace
in the container log, which is why this defect had to be diagnosed by
reading the code rather than by reading a log.

Whether to fix that here or file it separately is the implementer's
call. It is one line and the same method, which argues for here; it is
also a different defect, which argues for its own bug.

## Impact

- **Pre-existing.** Present since the controller was written in task
  006. Not introduced by task 020.
- **Surfaced by task 020.** The new `getJobById`, `updateJob` and
  `deleteJob` take an id from the caller. Task 029 wires the job detail
  page to a route param, so any mistyped, stale, or hand-edited URL
  becomes a 500.
- Alerting that treats 5xx as an outage signal will fire on user typos.
- Logs fill with 500s that are not server faults, and, because the
  handler logs nothing, without anything to distinguish them from real
  ones.
- Not a security issue. The response body leaks nothing; the status code
  is simply wrong.

## Proposed Fix

1. **Add a `MethodArgumentTypeMismatchException` handler** returning
   `400` with a typed code. Smallest change, matches how the other three
   handlers work, and keeps the mapping in the one place that already
   owns it. Needs a decision on the code: reuse `MALFORMED_REQUEST`,
   which currently means an unreadable body, or add a new one such as
   `INVALID_REQUEST_PARAMETER`. Reusing is fewer moving parts; adding is
   more precise for a client that switches on the code.
2. **Take the id as a `String` and parse it in the controller or
   service**, throwing an `ApiException` on failure. More explicit, but
   it moves conversion into every handler method and gives up the
   framework's binding for no gain.
3. **Handle the parent `TypeMismatchException`** instead. Broader, and
   would also cover a future query parameter of a non-string type. Also
   catches cases nothing has thought about yet, which cuts both ways.

Option 1 is the expected choice unless the test shows otherwise.

## Scope

In scope:

- One exception handler mapping a malformed path id to `400`.
- Its regression test.
- The error code, if a new one is added.
- Optionally the missing log line in `handleUnexpectedException`, if the
  implementer decides it belongs here.

Out of scope:

- No unrelated refactors.
- No unrelated formatting.
- No new libraries.
- No change to the `404` behaviour for a well-formed but absent id.
- No frontend change. The service already surfaces whatever the API
  returns as an `AppError`, and it does not care which status it was.

## Tests

A bug fix needs a test that **fails before the fix and passes after**.
Without one, nothing stops the defect returning.

- Regression test: `GET /api/jobs/not-a-uuid` responds `400` with the
  chosen error code. Assert the status and the code, not the message.
- Add the same for `PUT` and `DELETE`, since all three take the path
  variable and one handler covers all three. A test per verb is what
  proves that.
- Confirm the existing `404 JOB_NOT_FOUND` test for a well-formed absent
  id still passes unchanged. That is the case this fix must not break.

Rules:

- Do not skip tests.
- Do not weaken assertions.
- Verify the regression test actually fails against the unfixed code
  before fixing. Expect it to fail reporting `500` where `400` was
  wanted. A test that passes either way proves nothing.

## Validation

```bash
npm run backend:test
```

```bash
npm run backend:verify
```

Backend verification enforces 100 per cent line and branch coverage, so
the new handler needs a test that executes it or the build fails.

## Acceptance Criteria

- [x] The symptom no longer reproduces.
- [x] A regression test covers it and was seen to fail before the fix.
- [x] Existing tests pass unchanged.
- [x] Required verification passes.
- [x] No unrelated files are changed.

## Commit

```text
bug-002: return 400 for a malformed path id
```

## Fixed State

Option 1 was taken, with a new `INVALID_REQUEST_PARAMETER` code rather than
reusing `MALFORMED_REQUEST`. The two mean different things to a client:
one says something in the request line is wrong, the other says the body
is. A UI that switches on the code needs to tell them apart.

The code was first written as `INVALID_PATH_PARAMETER` and renamed in
review. `MethodArgumentTypeMismatchException` is what Spring raises for
`@RequestParam` conversion failures as well as `@PathVariable`, so the
narrower name would have reported "path" for a query-string mistake the
first time a typed request parameter was added. Nothing has one today,
so this was latent rather than broken, but the timing is asymmetric:
renaming before merge is free, and renaming a published error code that
a client already switches on is a contract break.

The handler takes no exception parameter and answers a fixed message. The
rejected value is caller-supplied text and echoing it back would be the
one way this response could leak something.

### Seen to fail first

Four tests were added to `JobControllerTest` and run against the unfixed
code. The enum constant was added first so they would compile, since a
constant is not the behaviour fix. They failed with:

```text
Status expected:<400> but was:<500>
```

After the handler, all 78 backend tests pass.

### Verified against the running stack

The bug was reported from `curl` against Compose, so the fix was checked
the same way after `npm run dev:compose` rebuilt the image.

| Request | Before | After |
| --- | --- | --- |
| `GET /api/jobs/not-a-uuid` | 500 `INTERNAL_ERROR` | 400 `INVALID_REQUEST_PARAMETER` |
| `GET /api/jobs/123` | 500 `INTERNAL_ERROR` | 400 `INVALID_REQUEST_PARAMETER` |
| `PUT /api/jobs/not-a-uuid` | 500 | 400 |
| `DELETE /api/jobs/not-a-uuid` | 500 | 400 |
| `GET /api/jobs/<absent uuid>` | 404 `JOB_NOT_FOUND` | 404 `JOB_NOT_FOUND` |

The last row is the one the fix had to leave alone, and did.

`npm run backend:verify` passes, including the 100 per cent line and
branch coverage gate.

### Left undone, deliberately

`handleUnexpectedException()` still logs nothing. Fixing it here would
have meant changing the behaviour of every genuine 500 in the same commit
that changes which responses are 500s at all, and the two want separate
regression tests. It needs its own bug.

The Postman collection was not extended with an `INVALID_REQUEST_PARAMETER`
request. That would put the new contract under the Newman CI gate and is
worth doing, but adding requests is not in this file's scope.
