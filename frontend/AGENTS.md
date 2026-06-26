# AGENTS.md - Frontend

Scope: this file governs `frontend/`. The root `../AGENTS.md` still
applies. If the two files disagree, this file wins for frontend code and
`../docs/context.md` wins for product intent.

Current stack:

```text
React 19
TypeScript
Vite
React Router 7
Tailwind CSS 4
React Hook Form
Zod
Vitest
React Testing Library
MSW
ESLint
Prettier
```

## 1. Structure

- Keep feature code under `src/features/<feature>/`.
- Keep page route components under `src/pages/<route>/`.
- Keep shared UI in `src/components/ui/`.
- Keep shared layout components in focused folders under
  `src/components/`.
- Keep hooks under `src/hooks/<hook-name>/` when the hook needs types,
  utilities, or tests.
- Keep API wrappers under `src/services/` until a feature-specific API
  module is justified.
- Keep shared domain types under `src/types/`.
- Prefer one focused `index.ts` only for a folder's public API.
- Do not export internal child components from a barrel file unless
  another folder should use them.

## 2. Naming

- Interfaces start with `I`.
- Type aliases start with `T`.
- React component files use PascalCase.
- Utility, constant, and type files use descriptive camelCase names that
  match the local folder pattern.
- Avoid duplicate type imports from the same module.
- Keep imports ordered as enforced by ESLint:
  1. Vitest imports first in test files.
  2. Testing Library imports in test files.
  3. React imports.
  4. Vite plugin imports, then Tailwind Vite plugin imports.
  5. External package imports.
  6. One blank line before project imports.
  7. Page imports.
  8. Shared UI/common component imports.
  9. Feature or local component imports.
  10. Icon component imports.
  11. Service/API imports.
  12. Local API entry imports such as `../api` in service files.
  13. Shared hook imports.
  14. Feature hook imports.
  15. Translation/i18n imports.
  16. Shared utility imports.
  17. Feature or local utility imports.
  18. Shared error imports.
  19. Route path imports such as `APP_PATHS` from `./paths`.
  20. Route constant imports such as `appRouteHandles` from
      `./routes.constants`.
  21. Shared constant imports.
  22. Feature or local constant imports.
  23. Direct local module imports, especially the file under test.
  24. Local config imports when the config file is the unit under test.
  25. Test render helper imports such as `renderWithProviders`.
  26. Test fixture/helper imports such as `createMockJobs`.
  27. Shared type imports.
  28. Type-only imports from shared component modules.
  29. Feature or local type imports.
- In test files, import the component, hook, or utility under test before
  shared project imports, render/test helpers, and local types.
- In config tests, import the config file under test before render helpers,
  translation helpers, and mock data.
- In source files, keep the main dependency or entry import first when it
  is the primary subject for that module, such as `postJson` from `../api`
  in service files.
- Import sorting follows this semantic order even when a utility imports a
  type from a later import.
- Type-only imports from component modules, such as `IDataTableColumn`,
  belong with the later type imports instead of the component value import
  block.
- In test files, do not add a blank line between the subject under test
  and the imports that follow it in the project-import block.
- In test files, local schema value/type imports come after render/test
  helpers unless the schema itself is the unit under test.
- In test files, supporting route/constants imports come after the
  subject under test and render/test helpers without an extra blank line.
- Prefer inline `type` specifiers when a file imports values and types
  from the same module.

## 2.1 Comments

- Use JSDoc-style comments for exported React components, exported hooks,
  exported utilities, exported constants, public interfaces, and public
  type aliases.
- Add JSDoc-style comments for local interfaces, types, and functions when
  they explain reusable structure or non-obvious behavior.
- Do not add comments for individual interface fields unless the field has
  non-obvious constraints, behavior, or rendering effects.
- Do not comment obvious JSX, simple assignments, or code whose name and
  type already explain the intent.
- Avoid comments that only repeat what the code already says.

Good:

```ts
/**
 * Props used by the job detail header.
 */
interface IJobDetailHeaderProps {
  job: TJobDetail;
  onEditJob?: () => void;
}
```

Avoid:

```ts
interface IJobDetailHeaderProps {
  /** Job detail data. */
  job: TJobDetail;

  /** Edit job callback. */
  onEditJob?: () => void;
}
```

## 3. UI And Styling

- Use the existing Tailwind design tokens and shared UI components.
- Do not introduce Mantine, styled-components, CSS Modules, or another
  styling system unless the task explicitly requires it.
- Use existing reusable components before adding a new one.
- Keep business logic out of JSX where practical; move transformation
  logic into utilities or hooks.
- Use semantic HTML first.
- Use icons from the existing icon components where available.

## 4. Forms

- Use React Hook Form with Zod for form state and validation.
- Reuse shared form field components for common form controls.
- Keep schemas close to the feature unless they are genuinely shared.
- Localized validation messages should be passed into schema factories.
- Avoid hidden assumptions in large forms; derive defaults through
  typed utilities.

## 5. Routing And Data

- Use React Router 7 route modules and shared route path constants.
- Prefer native `fetch` through the existing API wrapper.
- Do not add axios, Redux, RTK Query, or another data-fetching library
  unless explicitly requested.
- Keep mock/local persistence isolated so it can later be replaced by
  backend API calls.

## 6. Accessibility

- Use semantic elements before ARIA.
- Buttons and links must be keyboard accessible.
- Icon-only buttons need an accessible name.
- Form inputs need visible labels or an intentional accessible label.
- Prefer queries by role, label, and text in tests.
- Avoid `data-testid` unless no user-facing query is practical.

## 7. Tests

- Use Vitest and React Testing Library.
- Test user-visible behavior, not implementation details.
- Use MSW or focused service mocks for API boundaries.
- Keep tests colocated with the file under test.
- Update coverage only by adding meaningful tests, not by excluding
  production code without a reason.

## 8. Verification

Run frontend verification after frontend behavior changes:

```bash
npm run frontend:verify
```

For focused iteration:

```bash
npm run frontend:lint
npm run frontend:format:check
npm run frontend:test:coverage
npm run frontend:build
```
