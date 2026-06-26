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
  },
});
