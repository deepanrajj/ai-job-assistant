# Task 063 - Add AI Job Fit Ranking

Status: Not started

Related plan: [Product improvements - profile evidence](../../docs/business/product-improvements-and-recommendations-plan.md#ai-claims-need-profile-evidence).

## Instructions

Read `../../AGENTS.md`, `../../frontend/AGENTS.md`, `../../backend/AGENTS.md`, and `../../docs/context.md` before starting.

## Goal

Compare a saved job against a selected profile and show fit guidance.

## Scope

In scope:

- Add fit score, matched skills, missing skills, and explanation.
- Link matched-skill claims to entries from the selected profile input;
  distinguish missing evidence from proof that a user lacks a skill.
- Run from job detail using a selected profile.
- Save fit result as job AI output.

Out of scope:

- Auto-rejecting jobs.
- Cross-job ranking dashboard.
- Vector search.

## Required Changes

- Add backend fit ranking operation.
- Add job detail UI for selecting profile and viewing result.
- Persist confirmed or generated fit output.
- Include stable profile-entry references and the captured source text/
  version for the run. Validate references against the actual selected
  input; flag unsupported or invalid references as needing review.
- Show the referenced evidence with the explanation. Later profile edits
  must not silently rewrite evidence for an existing result. Reference
  validation does not replace user review of whether a claim is supported.

## Tests

- Fit result renders score and skill lists.
- Missing profile/job data is handled.
- Result can be regenerated.
- Supported, unsupported, and invalid profile references render distinctly.
- A profile edit does not change an earlier result's captured evidence.

## Validation

Run verification for touched frontend/backend layers.

## Acceptance Criteria

- [ ] Users can rank job fit.
- [ ] Fit output is explainable.
- [ ] Profile evidence is inspectable and unsupported claims are flagged.
- [ ] No job status changes automatically.

## Commit

```text
task-063: add ai job fit ranking
```
