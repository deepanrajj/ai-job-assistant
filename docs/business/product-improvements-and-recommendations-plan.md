# Product Improvements And Recommendations

Status: Planning recorded; implementation not started

Recorded: 2026-09-17

## Purpose

Preserve the repository walkthrough recommendations and make the existing
roadmap more executable. The product direction remains the one in
[context](../context.md): complete the non-AI tracker, add user ownership
and billing, then integrate AI into useful workflows.

This is a cross-task planning record, not permission to implement several
tasks together. Numbered task files remain execution boundaries. The
recommendation IDs below are planning references, not roadmap task numbers.
Nothing in this document marks a feature implemented or verified.

## Current Baseline

Job CRUD, dashboard reads, list/detail pages, English/German translations,
and standalone AI analysis exist. Tasks, notes, and timeline still need
their backend/frontend connections. Task 010 has local work in progress;
this plan does not change that work or declare it complete.

Kanban, source tracking, contacts, reminders, calendar, profile management,
import review, duplicate detection, and workflow AI are already planned.
They should not be recreated as new recommendations.

## Refinements To Existing Tasks

### Analytics Must Use History

[Task 018](../../tasks/roadmap/018-create-timeline-event-entity.md) and
[task 019](../../tasks/roadmap/019-track-timeline-events-when-job-status-changes.md)
must expose structured previous/next statuses and event timestamps.
Persist the job update and its event atomically. Display text is for
people; analytics must not parse it.

[Task 043](../../tasks/roadmap/043-add-dashboard-insights.md) depends on
persisted history and a frontend read contract that covers the jobs being
summarized. A per-job request loop is not an acceptable dashboard data
source. Define that bounded read contract in task 019 before task 043.

Metric rules for the first dashboard:

- The first recorded transition into APPLIED is the recorded application
  date. Later job edits and a repeated APPLIED transition do not reset it.
- Jobs saved/imported already in APPLIED without an application event
  have an unknown application date. Do not substitute job creation or
  update time. Historical date entry is a separate follow-up, R-11.
- Applications this week counts distinct jobs with a known recorded
  application date in the current Monday-to-Monday local calendar week.
  Show the date range and use the browser timezone consistently.
- Application age is the local calendar-day difference from that date
  for jobs still in APPLIED. Show unknown dates separately.
- Interview rate is the share of jobs in the selected application-date
  cohort that later have a recorded INTERVIEW transition. Jobs now in
  OFFER or REJECTED still count if their interview event exists. A jump
  straight to OFFER is not evidence of an interview.
- Response rate needs an explicitly recorded employer response and date.
  A status of REJECTED or WITHDRAWN alone is not proof of a response.
  Until R-11 supplies that data, show an unavailable explanation rather
  than a fabricated percentage. An unavailable value differs from 0%.
- Label cohort, date range, and excluded unknown-history records. Show
  percentages with their numerator/denominator; use unavailable when the
  denominator is zero. Small cohorts should display their actual counts.

### Non-AI Import Needs An Intake

[Task 047](../../tasks/roadmap/047-add-import-candidate-review-workflow.md)
includes a manual candidate intake: paste the description and fill or
correct company, role, location, and optional source URL. No automatic
extraction or remote page fetch is implied. Persist only a review
candidate at this step, never a Job.

Tasks 048 and 049 then classify duplicates and import the user's selected
candidates. R-01 adds CSV intake later using the same candidate contract;
a browser extension is a later, larger delivery. This avoids making task
047 depend on AI or a job-board provider.

### Compensation And Filtering Need Explicit Fields

R-07 is a standalone follow-up before offer comparison. Plan currency,
pay period (annual/monthly/hourly), work mode, and employment type across
the database, API, forms, and filters. Existing salary values have been
displayed as EUR; preserve that interpretation explicitly, but do not
invent an annual/monthly/hourly basis for old records. Unknown is valid.

Compare only compatible currencies and pay periods. Currency conversion,
tax calculations, and total-compensation assumptions are outside the
first version. Do not fold this change into the completed job CRUD tasks
or the unrelated source-tracking task.

### Reminder Delivery Is A Separate Follow-Up

Tasks 040 and 042 remain in-app reminders and calendar views. R-09 first
adds user-triggered calendar-file export, with date-only reminders kept
as all-day events. Timed interview events require explicit timezone data.
Export is not synchronization. Email reminders come later, after user
ownership, verified delivery addresses, opt-in preferences, and retry/
duplicate-delivery handling. Push and two-way sync remain deferred.

### AI Claims Need Profile Evidence

Tasks 063 to 066 must carry evidence references from fit results and
generated material to the selected profile entries used for that run.
Use stable entry identifiers and the source text/version captured for
the run; later profile edits must not silently change old evidence.

The backend validates that references belong to the selected input and
match its captured content. This checks reference integrity, not whether
the claim is true. The user still reviews the claim against its source.
Unknown references or unsupported claims are marked as needing review.
Missing profile evidence means "not evidenced in this profile," not
"the user does not have this skill."

Generated CVs and letters must not invent employers, dates, achievements,
qualifications, or metrics. Unsupported statements remain editable and
visibly unresolved until the user edits, removes, or confirms them. A
user confirmation is recorded as user supplied, not relabeled as
profile-backed evidence. Saving a draft must preserve unresolved flags.

Source links for discovered jobs remain distinct from profile evidence.
This uses structured input references, not embeddings or RAG. The
existing paid-AI sequencing and backend-only provider boundary remain.

## Recommendation Register

Priorities are relative product value, not delivery dates. Each item
needs a standalone numbered task and acceptance criteria before coding,
unless an existing task is explicitly named as its implementation home.

| ID | Recommendation | Priority | First useful delivery | Dependencies and boundary |
| --- | --- | --- | --- | --- |
| R-01 | Quick job capture | High | Manual paste intake in 047; then CSV preview with row errors and field mapping | CSV follows 047-049 and reuses duplicate review. Browser extension later; no automatic applications or arbitrary URL fetching. |
| R-02 | Interview rounds and preparation | High | Recruiter, technical, and final rounds with interviewer, meeting link, timezone, preparation tasks, and feedback | Persisted jobs/tasks/notes and contacts/calendar integration. A round is separate from the job's overall INTERVIEW status. |
| R-03 | Application snapshots | High | On explicit submission confirmation, preserve the job description and exact submitted material with a timestamp | Application documents and profile/draft content must exist. Metadata-only documents cannot supply exact content: accept pasted text first; file storage is separate. Later edits must not overwrite snapshots. |
| R-04 | Archive and restore | High | Archive closed jobs, hide them by default, filter archived jobs, and restore | Separate archival from outcome status and deletion. Define analytics inclusion explicitly; hiding a job must not silently remove historical outcomes. |
| R-05 | Export and backup | High | Jobs CSV plus a versioned JSON export of all supported tracker records | Include related notes/tasks/history as those models exist. Escape spreadsheet formula cells. Restore is a separate task with validation and conflict preview; export alone is not a tested restore system. |
| R-06 | Preparation templates | Medium | Apply a reusable checklist to a job and edit its copied tasks | Task persistence/integration. Later template edits must not rewrite an existing job's checklist. |
| R-07 | Compensation and job attributes | High | Currency, pay period, work mode, employment type, and filters | Standalone schema/API/UI task before R-08; preserve unknown values and existing EUR semantics. |
| R-08 | Job and offer comparison | Medium | Compare selected jobs on compatible compensation, commute, benefits, work mode, and user priorities | R-07 and explicit offer details. Keep advertised ranges separate from actual offers; no tax or FX estimates in the first version. |
| R-09 | Calendar export and later reminder delivery | Medium | Download calendar events; later add opt-in email reminders | Tasks 040/042; timed events need R-02 or equivalent timezone data. Email also requires 051/052 and delivery infrastructure. No two-way sync in the first version. |
| R-10 | Interview answer library | Medium | Store situation-task-action-result stories tagged by skill and link them to interview rounds | Profile and interview workflows. Manual editing first; AI suggestions later must follow evidence review rules. |
| R-11 | Historical milestones and employer responses | High | Let users record actual application/response dates and response type, including historical applications | Structured history from 018/019. Define corrections as append-only events and update analytics deliberately. No inference from edits, rejection, or withdrawal. Required to enable a numeric response rate in 043. |
| R-12 | Expanded demo scenarios | Medium | Extend the job-only seed with tasks, notes, timeline, reminders, contacts, documents, and profiles as each lands | Follow-up tasks after the relevant schemas; update reset/loading instructions and ownership once auth exists. Use synthetic data and no paid AI calls. |
| R-13 | German market employment attributes | Medium | Track contract type (permanent/Befristet with an end date), Probezeit length, Kündigungsfrist, Tarifvertrag, weekly hours, and vacation days per job, plus visa/Blue Card sponsorship and required German level | Standalone schema/API/UI task, independent of R-07's compensation fields. Preserve unknown values; do not infer any field from job description text. Feeds R-08 comparison once both exist, but does not depend on it. |

## Delivery Sequence

1. Complete the existing task, note, and timeline backend/frontend work,
   one numbered task at a time. Task 010 remains the next foundation task.
2. Bring the already-planned Playwright first journey (080) and a narrowly
   scoped job demo seed (070) forward. Basic job CRUD already exists;
   these do not need the whole advanced roadmap. Extend journeys in 081
   and demo scenarios through R-12 as features become available.
3. Deliver Kanban, reminders, and dashboard next actions. Historical
   analytics waits for structured events; numeric response rate also
   waits for R-11.
4. Deliver candidate intake/review/deduplication/import, then CSV capture,
   archive/restore, and export as separate tasks. Add R-07 before offer
   comparison and R-11 before promising response analytics.
5. Add interview rounds and application snapshots once their underlying
   records exist; follow with templates and the answer library.
6. Keep authentication/user-owned data before shared deployment and paid
   AI enforcement. Implement the planned profile-based AI workflows with
   evidence support, then expand delivery/integrations as justified.

## Promotion And Closure

- Link each new numbered task back to its R-ID and add its phase checkbox
  and task-index mapping. Do not reuse existing task numbers.
- Record the task link and implementation status here when promoted.
- Keep task and backlog completion unchecked until implementation and
  verification succeed. Planning completion is not feature completion.
- Keep the locked stack, billing rules, and deferred vector/RAG direction
  unchanged. No new dependency is authorized by this planning record.

### Promoted Tasks

| R-ID | Task | Status |
| --- | --- | --- |
| R-03 | [Task 082 - Add application snapshots](../../tasks/roadmap/082-add-application-snapshots.md) | Not started |
| R-13 | [Task 083 - Add German market job attributes](../../tasks/roadmap/083-add-german-market-job-attributes.md) | Not started |

## External Reference

[Teal's job-search browser extension](https://www.tealhq.com/tool/job-search-chrome-extension)
provides an example of saving opportunities while browsing. It supports
the quick-capture idea, not a promise of compatibility with any particular
job board. The priorities above come from this project's current gaps.
