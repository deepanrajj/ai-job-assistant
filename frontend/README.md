# Smart Job Tracker Frontend

React + TypeScript frontend for the Smart Job Tracker project.

## Scripts

```bash
npm run dev
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

## Structure

```text
src
  components   Shared UI, layout, tables, forms, and job dashboard components
  data         Local mock data used before the backend integration is complete
  errors       Shared frontend error model
  features     Feature-level UI for AI job analysis and follow-up questions
  hooks        Reusable React hooks
  i18n         Translation provider, hooks, utilities, and locale files
  pages        Route page components
  routes       React Router configuration and route metadata
  services     API and AI service clients
  test         Test setup, MSW handlers, and render helpers
  types        Shared domain types
  utils        Shared utility functions
```

## Quality Gates

Before pushing frontend changes, run:

```bash
npm run lint
npm run format:check
npm run test:coverage
npm run build
```
