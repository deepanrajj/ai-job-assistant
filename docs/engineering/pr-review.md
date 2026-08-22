# PR Review

Authoritative for anyone producing a pull request review in this
repository: a human reviewer, or an agent asked to "review this PR",
"review this branch", or "look at this diff".

Root `AGENTS.md` §6 defines the finding format and severity ladder. This
file is the operating procedure around it: what to read, what to look
for, what blocks a merge, and what to do when asked to fix findings.

Convention rules live in `AGENTS.md` §0, `backend/AGENTS.md`, and
`frontend/AGENTS.md`. Product and architecture decisions live in
`docs/context.md`. Cite those sources in findings — never restate their
text here or in review comments. If this file disagrees with them, they
win.

---

## 1. Scope And Mode

- **Review only.** Do not edit files, commit, or push unless the user
  explicitly asks for fixes ("apply the review", "fix these"). A fixing
  agent then follows §7.
- Flag issues **in the diff**. Do not expand scope into unrelated code.
- Do not restate `AGENTS.md` or `docs/context.md` — cite the section.
- Do not recommend approval while any `P1` finding is open
  (`AGENTS.md` §6).
- Do not invent finding categories that are not grounded in this file,
  the `AGENTS.md` files, or `docs/context.md`.
- A review-only agent does not run `npm run verify`; verification is the
  implementer's responsibility (`AGENTS.md` §3). Check the CI status
  instead: `Frontend Verify`, `Backend Verify`, and `Docker Build`
  (`docs/engineering/github-pipeline.md`).

### 1.1 Inputs To Read First

Always read:

- The PR description and the linked `tasks/<number>-<slug>.md`. **The
  task file is the scope boundary** (`AGENTS.md` §2).
- Any plan the task references under `docs/business/`. Plans are
  authoritative for intent; a diff that contradicts its plan is a
  finding even when it compiles and tests pass.
- Root `AGENTS.md`, especially §0.
- The full diff and every test file it changes.

Then read by area touched:

| Diff touches | Also read |
| --- | --- |
| `backend/` | `backend/AGENTS.md`; `docs/context.md` §4 (AI boundary) |
| `backend/src/main/resources/db/migration/` | `backend/AGENTS.md` §4; `docs/context.md` §10 |
| `backend/build.gradle.kts` | `backend/AGENTS.md` §6; `docs/context.md` §2, §10 |
| `frontend/` | `frontend/AGENTS.md`; `docs/context.md` §12 |
| `infra/`, `.github/workflows/` | `docs/infrastructure.md`; `docs/engineering/github-pipeline.md` |
| API routes or contracts | `docs/context.md` §6; `docs/swagger.md` |
| Only `docs/` and `tasks/` | Nothing further, unless the diff edits a
  hotspot doc (§6) |

Skip what the diff cannot violate. A docs-only change does not need the
app `AGENTS.md` files.

## 2. Categories

Assess every PR against these four categories. Each resolves to `PASS`
or `FAIL`. A category is `FAIL` if it has any open `P1` or `P2` finding.
Nits never fail a category.

| Category | Covers | Grounded in |
| --- | --- | --- |
| **Correctness** | Does the change do what the task and plan state; logic bugs; missing, deleted, or weakened tests; contradictions with the plan. | `AGENTS.md` §0, §2, §4 |
| **Conventions** | Structure, naming, style, and hygiene violations in the diff. | `backend/AGENTS.md` §1–§3; `frontend/AGENTS.md` §1–§6 |
| **Safety** | AI provider boundary, secret handling, data-loss risk in persistence changes. | `docs/context.md` §4; `backend/AGENTS.md` §4, §5 |
| **Quality gates** | Coverage-gate integrity, test layering, verification evidence. | `backend/AGENTS.md` §6; `frontend/AGENTS.md` §7; `docs/context.md` §8 |

## 3. Must-Catch List

Default severity `P1` unless the bullet says otherwise, subject to the
calibration rule in §5.

### 3.1 Scope And Tests

- **Scope drift (`AGENTS.md` §0, §2).** Changes outside the task file's
  stated scope; a refactor piggybacked onto a feature task; two tasks
  implemented in one change. Task files list explicit "Out of scope"
  items — check the diff against them.
- **Test preservation (`AGENTS.md` §4).** Tests deleted, `@Disabled`,
  `it.skip`, weakened assertions, or `Thread.sleep` added to hide
  timing. Existing tests changed without an intentional behaviour change
  named in the PR description.
- **Missing tests for new behaviour (`AGENTS.md` §0).** Production
  behaviour changed with no test in the affected layer. Backend needs
  unit tests for services and mappers and controller tests for
  validation, success, and error responses (`backend/AGENTS.md` §6);
  frontend tests user-visible behaviour (`frontend/AGENTS.md` §7).

### 3.2 Quality Gates

- **Coverage-gate erosion (`backend/AGENTS.md` §6).** The backend gate
  requires 100% line and branch coverage
  (`backend/build.gradle.kts`, `jacocoTestCoverageVerification`). Flag
  any new `jacocoClassExclusions` entry that hides real logic rather
  than a value-carrier package, any lowered threshold, and any frontend
  coverage exclusion added in place of a test. Excluding production code
  to make the gate pass is a `P1`; adding a narrow, precedented
  exclusion for a DTO/command package is not a finding.
- **Test layering.** Prefer a focused unit test over booting the whole
  context. A new `@SpringBootTest` where a plain unit test or a
  standalone `MockMvc` test would do is `P2`. Mocking the very boundary
  a test exists to cross is `P2`.

### 3.3 Safety — AI Boundary And Secrets

- **AI provider boundary (`docs/context.md` §4,
  `backend/AGENTS.md` §5).** Any frontend code calling OpenAI directly,
  any OpenAI key or provider URL reaching browser-visible code or
  `frontend/` env files, or AI calls moved out of the backend.
- **Log leakage (`docs/context.md` §4).** Logging raw job descriptions,
  prompts, full provider responses, or API keys — including inside
  exception messages and error responses returned to callers.
- **Provider errors leaked (`backend/AGENTS.md` §3, §5).** Provider
  exceptions or raw upstream bodies surfaced to callers instead of being
  converted to a typed `ApiException` with a user-safe message.
- **Committed secrets or artifacts (`AGENTS.md` §0).** API keys, local
  env files, Kubernetes secret values, build output, coverage output, or
  logs added to the repository. Check `infra/k8s/**` secret manifests
  carry placeholders only.

### 3.4 Persistence And Migrations

- **Editing an applied migration (`backend/AGENTS.md` §4,
  `docs/context.md` §10).** Schema changes made by modifying an existing
  `V##__*.sql` instead of adding a new one. Flyway stores a checksum of
  every applied migration; editing one makes startup fail validation on
  any environment that already ran it.
- **Duplicate migration version.** A new `V##` that collides with a
  version already on `main` (two `V3__*.sql` files) fails startup with
  "Found more than one migration with version N". Renumber the
  not-yet-merged migration.
- **Destructive schema change without a story.** Dropping or renaming a
  column or table, or tightening a constraint on existing data, with no
  note in the PR description about existing rows. Adding a `NOT NULL`
  column with no default to a populated table breaks inserts from any
  code that does not yet set it.
- **Entity/DTO bleed (`backend/AGENTS.md` §1, §4).** JPA entities
  serialized directly as API responses, request bodies bound straight to
  entities, or storage-only fields (for example `userId`) exposed in a
  response DTO. Request and response models belong in DTO files, not
  inline in controllers.
- **Schema and mapping drift.** An entity property added or renamed with
  no matching migration, or a column whose nullability disagrees between
  the migration and the Kotlin type.

### 3.5 API And Error Handling

- **Untyped errors (`backend/AGENTS.md` §3).** `throw Exception(...)`,
  generic `catch (e: Exception)` outside a final boundary that converts
  to a typed error, or error paths that bypass `ApiExceptionHandler` and
  return an ad-hoc body.
- **Missing request validation (`backend/AGENTS.md` §3).** A new request
  DTO field with no Bean Validation constraint where the contract
  requires one, or a controller taking a request body without `@Valid`.
- **Undocumented contract change (`docs/context.md` §6).** New, renamed,
  or removed routes without the corresponding update to the Current API
  section of `docs/context.md`. `P2`.

### 3.6 Conventions

- **Kotlin (`backend/AGENTS.md` §2).** `!!`, `var` where `val` works,
  wildcard imports, magic numbers or repeated literals that should be
  constants. Default `P2` — these are hygiene, not failure scenarios —
  except `!!` on a value that can genuinely be null, which is `P1`.
- **Backend structure (`backend/AGENTS.md` §1).** Code outside its
  domain package, provider request/response models mixed with public API
  DTOs, test support outside
  `src/test/kotlin/com/smartjobtracker/testsupport`.
- **Test framework rules (`backend/AGENTS.md` §6).** `kotlin.test`
  assertions or `kotlin.test.Test` instead of
  `org.junit.jupiter.api.Test` and AssertJ.
- **Frontend (`frontend/AGENTS.md` §1–§6).** Business logic in JSX,
  `any`, interfaces or type aliases without the `I`/`T` prefix, import
  order violations, a new styling system, a new data-fetching or state
  library, `data-testid` where a role/label query would work,
  icon-only buttons without an accessible name, form inputs without
  labels.
- **New dependency (`AGENTS.md` §0, `docs/context.md` §2, §10).** Any
  library added that the task did not explicitly ask for. The stack is
  locked; adding to it is a product decision, not an implementation
  detail.

### 3.7 Documentation

- **Premature checkboxes (`AGENTS.md` §5).** Task or backlog checkboxes
  ticked in a PR whose behaviour is not implemented and verified.
- **Stale docs (`AGENTS.md` §0).** A change to documented behaviour —
  routes, setup steps, ports, runtime commands — without the matching
  doc update in the same PR.

## 4. What This Project Does Not Gate On

State these explicitly so reviewers do not import ceremony from other
repositories:

- **No authentication or tenant scoping yet.** `userId` is nullable by
  design until the auth tasks land (`docs/context.md` §5). Do not file
  "missing ownership check" findings against job endpoints; do flag a
  change that makes future scoping harder.
- **No paid-AI enforcement yet** (`docs/context.md` §12).
- **Commit message format and commit count** are conventions
  (`AGENTS.md` §2), not blockers. At most a `nit`, and not at all on
  squash-merged PRs.
- **PR size** is not gated. Prefer small task-sized PRs, but a large
  cohesive task is fine.

## 5. Severity

Use the labels and format from `AGENTS.md` §6: `P1` blocking, `P2`
should fix before merge, `nit` optional.

Calibration:

- A `P1` needs a **concrete failure scenario** — what breaks, for whom,
  with what input — tied to a bullet in §3. A finding whose only impact
  is style, structure, or hygiene is `P2` or below. Safety (§3.3),
  data-loss (§3.4), and test-preservation findings keep their `P1`
  default.
- **Check the base branch first.** A defect that already exists on
  `main` and is merely repeated by the diff is `P2` or below, labelled
  "pre-existing" — unless the diff materially worsens it. New exposure
  counts as worsening: a new caller, endpoint, or query that carries the
  defect into surface `main` did not have keeps its default severity.
- **Do not re-file.** A finding already declined with a rationale, or
  deferred to a tracked issue, is not re-raised without new evidence.
  Link the earlier thread instead.
- **Verify before filing.** Read the surrounding code, not just the diff
  hunk. A claim that a value can be null, that an index is missing, or
  that a test does not cover a path must be checked against the file
  before it becomes a `P1`.

## 6. Hotspots

A PR is a hotspot if it touches any of:

- **Flyway migrations** — any `backend/src/main/resources/db/migration/V##__*.sql`.
- **The AI boundary** — `backend/src/main/kotlin/com/smartjobtracker/ai/**`,
  `config/OpenAiProperties.kt`, or anything handling the OpenAI key.
- **Build and gate configuration** — `backend/build.gradle.kts`
  (dependencies, JaCoCo exclusions, coverage thresholds),
  `frontend/vite.config.ts`, `frontend/vitest` coverage config,
  root `package.json` verification scripts.
- **The rule files themselves** — any `AGENTS.md` at any depth,
  `docs/context.md`, and this file. A PR that edits the rules it is
  judged against needs a human decision, not an agent's approval.
- **CI and infrastructure** — `.github/workflows/**`, `infra/**`,
  including Dockerfiles, Kubernetes manifests, and secret examples.

Hotspot PRs are never auto-approved by an agent. Report findings
normally, then leave the approval decision to a human, even when the
diff is clean. Severity still applies: an open `P1` on a hotspot is
still `REQUEST_CHANGES`.

## 7. Fix Mode

Review-only is the default (§1). Fix mode starts only on an explicit
instruction ("apply the review", "fix these"). The implementing rules in
`AGENTS.md` §0 apply unchanged.

- **Validate before fixing.** A finding is a claim, not a fact. Confirm
  the failure scenario against the code first. Where practical, write
  the failing test before the fix. A finding that does not hold up is
  declined in-thread with the evidence, not silently ignored.
- **Fix `P1` and `P2`. Nits are optional** — apply one only when it is
  cheap and consistent with the conventions.
- **Batch the round.** Collect all open findings, triage each to fixed /
  declined / deferred, then make one push. Do not push per finding.
- **Reviewer suggestions are hypotheses.** Check a suggested fix against
  `backend/AGENTS.md`, `frontend/AGENTS.md`, and the linked plan before
  applying it. A suggestion can itself violate the conventions.
- **Run the gate before pushing** — `npm run verify`, or the narrower
  `npm run backend:verify` / `npm run frontend:verify` when only one app
  changed (`AGENTS.md` §3).
- **Stop and ask** before auto-fixing anything touching a hotspot (§6) —
  migrations, the AI boundary, gate configuration, or a locked decision
  in `docs/context.md`. Even an obvious-looking change there is a
  product or infrastructure decision.
- **Cap the loop at five rounds.** After that, post a summary of what
  was fixed, declined, and deferred, and hand back to a human.

## 8. Output

Use the finding format from `AGENTS.md` §6 for each finding:

```text
**[P1] Short title**
File: `path/to/file:line`
Rule: AGENTS.md section or app AGENTS.md section
Issue: One or two sentences.
Suggested fix: One or two sentences.
```

Then close with a summary so a reader sees the state in one place:

```text
## Review Summary

Verdict: REQUEST_CHANGES | COMMENT | APPROVE
Hotspot: yes | no

| Category      | Status |
| ------------- | ------ |
| Correctness   | PASS   |
| Conventions   | FAIL   |
| Safety        | PASS   |
| Quality gates | PASS   |

Findings: 0 P1 · 2 P2 · 1 nit

Inputs read: tasks/006-create-job-controller.md,
docs/business/006-create-job-controller-plan.md, backend/AGENTS.md
```

Rules for the summary:

- Verdict is `REQUEST_CHANGES` when any `P1` is open, `COMMENT` when
  only `P2`/nits are open or the PR is a hotspot, `APPROVE` only with
  zero open `P1` and `P2` on a non-hotspot PR whose task file and plan
  were read.
- Every `FAIL` category must have a visible finding explaining it.
- List the inputs actually read. A review that skipped the task file
  cannot recommend approval.
- Say `No findings.` rather than padding with speculative nits.
