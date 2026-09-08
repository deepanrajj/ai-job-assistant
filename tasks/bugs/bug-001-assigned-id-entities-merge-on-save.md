# Bug 001 - Assigned-Id Entities Take The Merge Path On Save

Status: Fixed
Severity: P2
Reported: task 009 branch review

## Instructions

Read these files before starting:

- `../../AGENTS.md`
- `../../docs/context.md`
- `../../backend/AGENTS.md`

Follow `AGENTS.md` exactly. Fix this defect only. Do not expand scope
beyond this file.

## Symptom

Creating a `Job` or a `Task` runs two database statements instead of
one: a `SELECT` for the row that does not exist yet, then the `INSERT`.

## Reproduction

1. Enable Hibernate SQL logging or `Statistics` in a focused backend
   test.
2. Save a newly built `Job` through `JobRepository.save(...)`, or a
   `Task` through `TaskRepository.save(...)`.
3. Observe a `SELECT ... FROM jobs WHERE id=?` before the `INSERT`.

## Expected And Actual

- Expected: saving a new entity issues an `INSERT` only, and returns the
  instance that was passed in.
- Actual: it issues a `SELECT` then an `INSERT`, and returns a different,
  managed instance while the caller's object stays detached.

## Root Cause

`SimpleJpaRepository.save()` calls `persist()` only when
`entityInformation.isNew(entity)` is true, and `merge()` otherwise.
`JpaMetamodelEntityInformation.isNew()` decides by testing whether the
`@Id` is null.

`Job` (`backend/src/main/kotlin/com/smartjobtracker/jobs/Job.kt`) and
`Task` (`backend/src/main/kotlin/com/smartjobtracker/tasks/Task.kt`)
both carry an assigned, non-null `UUID` id that the service sets before
saving, and neither declares `@Version` nor implements `Persistable`.
So `isNew()` is always false and every save merges, including the first.

## Impact

- A redundant `SELECT` on every insert. Small at current row counts, and
  on the write path every future domain will copy.
- `merge()` returns a managed copy. Code written as
  `repository.save(entity); return entity` returns an object that is not
  the persisted one, and later changes to it are silently dropped.
  `DefaultJobService.createJob` avoids this today by returning `save`'s
  result, but nothing enforces that and the next service may not.
- Pre-existing on the job side since task 004. Task 009 carried the same
  shape into a second domain, which is what surfaced it.

## Proposed Fix

1. Implement `Persistable<UUID>` on both entities with a `@Transient`
   new-state flag cleared by `@PostPersist` and `@PostLoad`. Direct, but
   adds mutable state and branches to entities that are currently pure
   data, and the backend gate requires 100 per cent line and branch
   coverage.
2. The same, lifted into a shared `@MappedSuperclass` so later entities
   inherit it. More upfront structure, less repetition later.
3. Add `@Version`, which makes `isNew()` correct as a side effect. This
   introduces an optimistic-locking column and therefore a Flyway
   migration, so it is a schema decision, not only a code one.

Record the choice and the reasoning in a plan under
`../../docs/business/` before implementing.

## Scope

In scope:

- `Job` and `Task`, changed consistently so a third entity has an
  obvious pattern to follow.
- The regression test below.

Out of scope:

- Switching identifier generation to `@GeneratedValue`. Services own id
  generation deliberately; changing that is an architecture decision,
  not a defect fix.
- Note, timeline, or other entities that do not exist yet.
- Any API, DTO, or endpoint change.
- No unrelated refactors or formatting.
- No new libraries.

## Tests

- Regression test: saving a newly created entity issues an insert with
  no preceding select, asserted through Hibernate `Statistics` query and
  entity-insert counts rather than inspected by eye.
- Saving an existing entity still updates it.
- Existing job and task persistence, repository, service, and
  integration tests pass unchanged.

Verify the regression test fails against the unfixed code before fixing.

## Validation

```bash
npm run backend:verify
```

## Acceptance Criteria

- [x] Creating a `Job` or `Task` no longer issues a select before the
      insert.
- [x] A regression test covers it and was seen to fail before the fix.
- [x] `Job` and `Task` use the same mechanism.
- [x] Existing tests pass unchanged.
- [x] Backend verification passes.
- [x] No unrelated files are changed.

## Commit

```text
bug-001: stop assigned-id entities merging on save
```

## Resolution

Fixed by option 2. `AssignedIdEntity`, a `@MappedSuperclass` in
`com.smartjobtracker.persistence`, implements `Persistable<UUID>` and
owns the assigned id plus a `@Transient` flag cleared by `@PostPersist`
and `@PostLoad`. `Job` and `Task` extend it.

The consequence this ticket did not anticipate: with `Persistable`, a
rebuilt instance carrying an existing id reports itself as new, so
`DefaultJobService.updateJob` could no longer construct a replacement
`Job`. It now mutates the loaded entity and lets dirty checking write
the update, which made `Job`'s editable columns `var`.

That turned out to fix a third defect this ticket did not name. Before
the change, saving a rebuilt entity over an existing id silently
overwrote the stored row, because merge copies values onto whatever is
there. It now raises `DuplicateKeyException`, so `save` can tell a
create from an update.

Reasoning and rejected alternatives:
`../../docs/business/bug-001-assigned-id-entities-merge-on-save-plan.md`.
