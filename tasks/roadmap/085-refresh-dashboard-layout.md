# Task 085 - Refresh Dashboard Layout

Status: Completed

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
- Added at the owner's request after the first pass: icon tiles on the
  insight cards, a week-over-week trend for applications this week, and
  a recent-activity table on desktop with recorded application dates.
  Both new figures come from the existing status history.

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

- [x] Dashboard follows the approved hierarchy using real data.
- [x] The response-rate limitation remains clear.
- [x] Optional reminders and independent failure states still work.
- [x] Desktop and mobile layouts are readable and keyboard accessible.
- [x] Focused tests and frontend verification pass.

Local verification: `npm run frontend:verify` passed 966 tests, lint,
format check, coverage, and build. The populated dashboard was checked
in the running app at 320 px in German and at 1280 px in English (in a
1280 px iframe, since the browser window could not be resized). The
reminders card is a weekly agenda rather than the prototype's seven-day
grid, since the dashboard loads only the next five reminders; see D3 in
the plan. Following a richer reference image from the owner, the
insight cards gained icon tiles, applications this week gained a
week-over-week trend from recorded history, and recent activity became a
table on desktop with recorded applied dates (D5-D7).

## Commit

```text
task-085: refresh dashboard layout
```
