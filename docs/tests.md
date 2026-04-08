# trade-imports-animals-tests

**Repo:** DEFRA/trade-imports-animals-tests

## Purpose

End-to-end browser test suite for the trade imports animals service. Tests run against a live stack from a user's perspective, covering full journeys through the frontend application. Supports multiple execution environments: local development, GitHub Actions CI, and DEFRA CDP Portal.

## Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Test framework:** Playwright (browser automation + assertions)
- **Reporting:** Allure (HTML reports, published to S3)
- **Linting:** ESLint, Prettier, typescript-eslint

## Infrastructure dependencies

Requires a running instance of the full stack (frontend + backend + dependencies) to test against. For local runs, use `docker compose` from the workspace root first.

## How to run

```bash
npm install
npx playwright install chromium    # first time only

npm run test:local                 # run against local docker compose stack
npm run test:github                # GitHub Actions config
npm test                           # CDP Portal config
```

Headed / debug mode:
```bash
npm run test:local -- --headed
npm run test:local -- --debug
```

Reports:
```bash
npx playwright show-report         # open HTML report
npm run report                     # generate Allure report
```
