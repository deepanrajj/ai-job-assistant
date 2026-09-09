import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  test: {
    coverage: {
      exclude: [
        'dist/**',
        'src/**/*.constants.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.types.ts',
        'src/**/index.ts',
        'src/main.tsx',
        'src/test/**',
        'src/vite-env.d.ts',
      ],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
    css: true,
    environment: 'jsdom',
    restoreMocks: true,
    setupFiles: './src/test/setupTests.ts',
    // Vitest defaults to 5000ms, which suits fast unit tests. Tests here
    // pay for Vite transforms and jsdom React rendering before any
    // assertion runs - router.test.ts alone spends about 3s transforming
    // lazy route modules - so under the full 107-file suite the unluckiest
    // test would exceed the default and fail while passing in isolation.
    // This raises the ceiling; it does not slow anything down or weaken an
    // assertion. A test that genuinely approaches this budget is too slow
    // and should be split, as JobDetailActivePanel.test.tsx was.
    testTimeout: 15000,
  },
});
