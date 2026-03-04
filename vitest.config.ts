import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'tests'], // Exclude playwright tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/**',
        'src/types/**',
        'src/**/*.d.ts',
        '**/*.config.{ts,js,mjs}',
        'src/app/layout.tsx',
        'src/app/sw.ts',
        'src/app/serwist.ts',
      ],
      thresholds: {
        statements: 64,
        branches: 54,
        functions: 55,
        lines: 65,
      },
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})




