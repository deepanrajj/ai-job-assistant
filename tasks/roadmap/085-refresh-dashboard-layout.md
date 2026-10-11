# Task 085 - Refresh Dashboard Layout

Status: Not started

Related plan: [Frontend visual refresh](../../docs/business/084-frontend-visual-refresh-plan.md).

Depends on: [Task 084](./084-refresh-frontend-theme-and-shell.md).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`,
`../../docs/context.md`, and the related plan before starting. Follow
`AGENTS.md` exactly. Implement this task only.

## Context

The prototype places key insights first, pipeline and dated next steps
in the middle, and recent applications below. The real dashboard loads
jobs, status history, and optional reminders independently. Its
response-rate metric is intentionally unavailable until actual employer
responses are recorded.

## Goal

Make the real dashboard resemble the approved overview while retaining
its existing data, explanations, and independent failure states.

## Scope

In scope:

- Recompose `DashboardPage` and its existing dashboard components into
  the metric, pipeline/reminder, and recent-application hierarchy.
- Show a weekly reminder presentation only from existing dated
  reminders while that feature is enabled; otherwise use the available
  next-reminders presentation.
- Use the shared theme, responsive cards, readable status colors, and
  existing route links.

Out of scope:

- Hard-coded prototype counts, companies, dates, or unsupported status
  stages such as separate phone-screen/final-round job statuses.
- New timeline or calendar endpoints, response-rate inference, or
  enabling the reminders production flag.

## Pre-Execution

1. Inspect `DashboardPage`, `DashboardInsights`, `DashboardMetrics`,
   `DashboardNextReminders`, `DashboardStatusOverview`, and
   `DashboardRecentActivity` with their tests.
2. Identify what each existing API state supplies before choosing the
   final card arrangement.

## Required Changes

1. Reuse the current calculations and components where practical;
   adjust only presentation and composition.
2. Keep the unavailable response-rate explanation visible and accurate.
3. Preserve first-run empty, loading, jobs error, history error, and
   reminders error behavior with useful retry actions.
4. Check the layout at desktop and narrow viewports.

## Data And Contracts

No API or persistence changes. Keep `REMINDERS_FEATURE_ENABLED` and
existing status-history behavior.

## Tests

- Real job/history inputs produce the expected insight values in the
  redesigned layout.
- The reminders card handles enabled, absent, empty, loading, and error
  cases without hiding unrelated dashboard content.
- Recent job links and existing retry actions remain usable.

## Validation

Run affected dashboard Vitest files, then `npm run frontend:verify`.
Visually check populated and empty/error states. Report focused local
checks and actual CI E2E status in the PR description.

## Acceptance Criteria

- [ ] Dashboard follows the approved hierarchy using real data.
- [ ] The response-rate limitation remains clear.
- [ ] Optional reminders and independent failure states still work.
- [ ] Desktop and mobile layouts are readable and keyboard accessible.
- [ ] Focused tests and frontend verification pass.

## Commit

```text
task-085: refresh dashboard layout
```
