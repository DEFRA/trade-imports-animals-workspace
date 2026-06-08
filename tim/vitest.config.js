import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.js'],
      exclude: [
        ...configDefaults.exclude,
        'coverage',
        'vitest.config.js',
        'eslint.config.js',
        'src/**/*.test.js',
        'src/test-support/**',
        'src/**/__fixtures__/**',
        'src/**/fixtures/**',
        // cli.js is the bin entry — covered behaviourally via subprocess
        // tests in cli.test.js, which v8 coverage can't instrument.
        'src/cli.js'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
})
