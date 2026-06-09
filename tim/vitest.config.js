import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    // Subprocess-spawning tests (docker, start, exec) hit the default 5s
    // timeout under parallel load when many test files run concurrently.
    // 15s is the headroom they need without slowing passing tests.
    testTimeout: 15_000,
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
        'src/cli.js',
        // Command action handlers are integration-tested through the CLI
        // (real subprocess spawn in *.test.js). The logic inside each
        // command file (buildTasks, parseBranch, collectStatuses, etc.) is
        // exercised through those tests; the action() boilerplate is glue.
        'src/commands/**'
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
