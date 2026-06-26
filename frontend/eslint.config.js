import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * Classifies import paths into Smart Job Tracker's semantic import groups.
 */
const importCustomGroups = [
  {
    elementNamePattern: '^vitest$',
    groupName: 'vitest',
  },
  {
    elementNamePattern: '^@testing-library(/.*)?$',
    groupName: 'testing-library',
  },
  {
    elementNamePattern: '^@vitejs(/.*)?$',
    groupName: 'vite-plugin',
  },
  {
    elementNamePattern: '^@tailwindcss(/.*)?$',
    groupName: 'tailwind-plugin',
  },
  {
    elementNamePattern: '^(react|react-dom)(/.*)?$',
    groupName: 'react',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+pages(?:/|$)',
    groupName: 'pages',
  },
  {
    anyOf: [
      {
        elementNamePattern: '^(?:\\.\\.?/)+components/(?!icons(?:/|$)).+',
        modifiers: ['value'],
      },
      {
        elementNamePattern: '^(?:\\.\\.?/)+(ui|form|dataTable)(?:/|$)',
        modifiers: ['value'],
      },
    ],
    groupName: 'common-components',
  },
  {
    anyOf: [
      {
        elementNamePattern: '^(?:\\.\\.?/)+components/icons(?:/|$)',
        modifiers: ['value'],
      },
      {
        elementNamePattern: '^(?:\\.\\.?/)+icons(?:/|$)',
        modifiers: ['value'],
      },
      {
        elementNamePattern: '^(?:\\.\\.?/)+(?:[^/]+/)*[^/]+\\.icons$',
        modifiers: ['value'],
      },
      {
        elementNamePattern: '.*Icon$',
        modifiers: ['value'],
      },
    ],
    groupName: 'icons',
  },
  {
    anyOf: [
      {
        elementNamePattern: '^(?:\\.\\.?/)+(?!components/)(?:[^/]+/)*components(?:/|$)',
        modifiers: ['value'],
      },
      {
        elementNamePattern: '^(?:\\.\\.?/)+(?:[^/]+/)*[A-Z][^/]*$',
        modifiers: ['value'],
      },
      {
        elementNamePattern: '^(?:\\.\\.?/)+(?:layout|parts|fields)(?:/|$)',
        modifiers: ['value'],
      },
      {
        elementNamePattern: '^(?:\\.\\.?/)+features/(?!jobs$)(?!.*\\.(constants|types|utils)$).+',
        modifiers: ['value'],
      },
      {
        elementNamePattern: '^(?:\\.\\.?/)+(analyzeJob|askJob)(?:/|$)',
        modifiers: ['value'],
      },
    ],
    groupName: 'feature-components',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+errors(?:/|$)',
    groupName: 'common-error-types',
    modifiers: ['type'],
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+errors(?:/|$)',
    groupName: 'common-errors',
    modifiers: ['value'],
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+hooks(?:/|$)',
    groupName: 'common-hooks',
  },
  {
    anyOf: [
      {
        elementNamePattern: '^(?:\\.\\.?/)+features/jobs$',
      },
      {
        elementNamePattern:
          '^(?:\\.\\.?/)+(?!.*\\.(config|constants|types|utils)$)(?:[^/]+/)*use[A-Z][^/]*$',
      },
    ],
    groupName: 'feature-hooks',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+i18n(?:/|$)',
    groupName: 'i18n',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+services(?:/|$)',
    groupName: 'services',
    modifiers: ['value'],
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+api(?:/|$)',
    groupName: 'local-api',
    modifiers: ['value'],
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+(?:routes/)?paths$',
    groupName: 'route-paths',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+(?:routes/)?routes\\.constants$',
    groupName: 'route-constants',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+utils(?:/|$)',
    groupName: 'common-utils',
  },
  {
    elementNamePattern: '^\\./(?!.*(Schema|schema)\\.config$).+\\.config$',
    groupName: 'local-config',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+(?:[^/]+/)*[^/]+\\.utils$',
    groupName: 'feature-utils',
  },
  {
    anyOf: [
      {
        elementNamePattern: '^(?:\\.\\.?/)+constants(?:/|$)',
      },
    ],
    groupName: 'common-constants',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+(?:[^/]+/)*[^/]+\\.constants$',
    groupName: 'feature-constants',
  },
  {
    elementNamePattern: '^\\./(?!.*(Schema|schema|\\.constants|\\.types)$).+',
    groupName: 'local-modules',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+test/render',
    groupName: 'test-render-helpers',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+test(?:/|$)',
    groupName: 'test-fixtures',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+types(?:/|$)',
    groupName: 'common-types',
  },
  {
    anyOf: [
      {
        elementNamePattern: '^(?:\\.\\.?/)+components/(?!icons(?:/|$)).+',
        modifiers: ['type'],
      },
      {
        elementNamePattern: '^(?:\\.\\.?/)+(ui|form|dataTable)(?:/|$)',
        modifiers: ['type'],
      },
    ],
    groupName: 'common-component-types',
  },
  {
    elementNamePattern: '^(?:\\.\\.?/)+(?:[^/]+/)*[^/]+\\.types$',
    groupName: 'feature-types',
  },
];

/**
 * Base import sorting order used by frontend source and configuration files.
 */
const importSortOptions = {
  customGroups: importCustomGroups,
  groups: [
    'vitest',
    'testing-library',
    'react',
    'vite-plugin',
    'tailwind-plugin',
    'external',
    {
      newlinesBetween: 1,
    },
    'pages',
    'common-components',
    'feature-components',
    'icons',
    'services',
    'local-api',
    'common-hooks',
    'feature-hooks',
    'i18n',
    'common-utils',
    'feature-utils',
    'common-error-types',
    'common-errors',
    'route-paths',
    'route-constants',
    'common-constants',
    'feature-constants',
    'local-modules',
    'local-config',
    'test-render-helpers',
    'test-fixtures',
    'common-types',
    'common-component-types',
    'feature-types',
    ['parent', 'sibling', 'index'],
    'unknown',
  ],
  ignoreCase: true,
  newlinesBetween: 0,
  newlinesInside: 0,
  order: 'asc',
  sortBy: 'path',
  sortSideEffects: false,
  type: 'natural',
  useExperimentalDependencyDetection: false,
};

/**
 * Test-specific import sorting order that keeps the unit under test first.
 */
const testImportSortOptions = {
  ...importSortOptions,
  groups: [
    'vitest',
    'testing-library',
    'react',
    'vite-plugin',
    'tailwind-plugin',
    'external',
    {
      newlinesBetween: 1,
    },
    'local-modules',
    'local-config',
    'pages',
    'common-components',
    'feature-components',
    'icons',
    'services',
    'local-api',
    'common-hooks',
    'feature-hooks',
    'common-utils',
    'feature-utils',
    'common-error-types',
    'common-errors',
    'test-render-helpers',
    'i18n',
    'test-fixtures',
    'route-paths',
    'route-constants',
    'common-types',
    'common-component-types',
    'feature-types',
    'common-constants',
    'feature-constants',
    ['parent', 'sibling', 'index'],
    'unknown',
  ],
};

export default defineConfig([
  globalIgnores(['coverage', 'dist', '.codex-temp']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      perfectionist,
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: true,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
          custom: {
            regex: '^T[A-Z]',
            match: true,
          },
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          prefer: 'type-imports',
        },
      ],
      'no-duplicate-imports': [
        'error',
        {
          allowSeparateTypeImports: false,
          includeExports: true,
        },
      ],
      'perfectionist/sort-imports': ['error', importSortOptions],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      'perfectionist/sort-imports': ['error', testImportSortOptions],
    },
  },
  eslintConfigPrettier,
]);
