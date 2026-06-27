# Task 039 - Add Job Contacts

## Instructions

Read `../AGENTS.md`, `../frontend/AGENTS.md`, `../backend/AGENTS.md`, and `../docs/context.md` before starting.

## Goal

Allow users to store recruiter, hiring manager, referral, and contact history for a job.

## Scope

In scope:

- Add contact data to the job workflow.
- Support contact name, role/type, email or profile URL, and notes.
- Show contacts on job detail.

Out of scope:

- Email sending.
- CRM-style global contact management.
- Calendar integration.

## Required Changes

- Add contact model support in the current persistence path.
- Add accessible create/edit/delete UI for job contacts.
- Update tests and translations.

## Tests

- Contacts render on job detail.
- Contact create/update/delete works through the chosen data path.
- Blank optional fields are handled.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Users can manage contacts per job.
- [ ] Contact history can be captured.
- [ ] Tests cover contact behavior.

## Commit

```text
task-039: add job contacts
```
