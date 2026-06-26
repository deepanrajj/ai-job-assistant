# Task 037 - Let User Select Generated Tasks Before Saving

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, and `../docs/context.md`
before starting.

## Goal

Let users choose which AI-generated preparation tasks to save.

## Scope

In scope:

- Show generated task suggestions before they are added to the job.
- Let the user select or deselect suggestions.
- Save only selected tasks.

Out of scope:

- Backend AI prompt changes unless required by the existing response.
- Drag-and-drop or advanced task editing.
- RAG behavior.

## Required Changes

- Adjust saved-job AI flow so generated tasks are staged before saving.
- Reuse existing task creation behavior.
- Add accessible checkbox or selection controls.

## Tests

- Suggestions render after analysis.
- User can select/deselect tasks.
- Only selected tasks are saved.

## Validation

Run `npm run frontend:verify`.

## Acceptance Criteria

- [ ] Generated tasks are not all saved automatically.
- [ ] User selection controls are accessible.
- [ ] Tests cover selection behavior.

## Commit

```text
task-037: let user select generated tasks before saving
```
