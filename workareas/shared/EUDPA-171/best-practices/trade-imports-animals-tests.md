# Best practices applicable to trade-imports-animals-tests

Concatenated from `docs/best-practices/` at prepare-review time.
Apply these standards when reviewing files in this repo.


---

## Source: `docs/best-practices/playwright/BEST_PRACTICES.md`

# Playwright Best Practices

**Golden Rule:** Design tests for simplicity. Tests should read like HTML, not logic puzzles.

## Test Design

### Do - AAA Pattern
```typescript
test('user sees welcome after login', async ({ page }) => {
  // Arrange
  await page.goto('/login')

  // Act
  await page.getByLabel('Email').fill('user@test.com')
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // Assert
  await expect(page.getByText('Welcome back')).toBeVisible()
})
```

### Name with What/When/Then
```typescript
// Good
test('checkout form: when shipping empty, shows validation error', ...)

// Bad
test('checkout test', ...)
```

### Keep Flat and Simple
```typescript
await page.fill('[data-testid="email"]', 'test@example.com')
await page.click('button[type="submit"]')
await expect(page.getByText('Submitted')).toBeVisible()
```

## Locators

### Use Role-Based/Semantic
```typescript
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email address')
page.getByPlaceholder('Search...')
page.getByText('Welcome back')
page.getByTestId('checkout-summary')  // when no accessible name
```

### Chain and Filter
```typescript
page.getByRole('listitem')
  .filter({ hasText: 'Product A' })
  .getByRole('button', { name: 'Add to cart' })
```

### Avoid
- CSS class selectors (`.btn-primary`)
- XPath (`//div[@class="container"]`)
- Dynamic IDs (`button-12345`)

## Assertions

### Use Web-First (auto-wait and retry)
```typescript
await expect(page.getByText('Success')).toBeVisible()
await expect(page.getByRole('alert')).toHaveText('Saved')
await expect(page).toHaveURL(/\/dashboard/)
```

### Use Soft Assertions
```typescript
await expect.soft(page.getByTestId('name')).toHaveText('John')
await expect.soft(page.getByTestId('email')).toHaveText('john@example.com')
```

### Avoid Manual Boolean Checks
```typescript
// Bad - no retry
expect(await page.getByText('Success').isVisible()).toBe(true)
```

## Waiting

### Rely on Auto-Waiting
Actions like `click()`, `fill()` wait automatically.

### Wait for Specific Conditions
```typescript
await page.waitForURL('**/dashboard')
await page.waitForResponse(resp => resp.url().includes('/api/user'))
await expect(page.getByTestId('spinner')).toBeHidden()
```

### Never Use Fixed Timeouts
```typescript
// Bad
await page.waitForTimeout(3000)
```

## Test Structure

### Keep Tests Isolated
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/login')
})
```

### Set Up Data via API
```typescript
test.beforeEach(async ({ request }) => {
  await request.post('/api/test/seed-user', { data: testUser })
})
```

### Each Test Creates Own Data
```typescript
test('can update site', async ({ page, request }) => {
  const site = await request.post('/api/sites', { data: { name: 'Test' } })
  await page.goto(`/sites/${site.id}`)
})
```

### Use Realistic Data (Faker)
```typescript
import { faker } from '@faker-js/faker'
const user = {
  name: faker.person.fullName(),
  email: faker.internet.email(),
}
```

### Reuse Authentication
```typescript
// global-setup.ts
await page.goto('/login')
await page.fill('#email', process.env.TEST_USER)
await page.fill('#password', process.env.TEST_PASS)
await page.click('button[type="submit"]')
await page.context().storageState({ path: 'auth.json' })

// playwright.config.ts
use: { storageState: 'auth.json' }
```

## Page Object Model

```typescript
export class LoginPage {
  constructor(private page: Page) {}

  readonly emailInput = () => this.page.getByLabel('Email')
  readonly passwordInput = () => this.page.getByLabel('Password')
  readonly submitButton = () => this.page.getByRole('button', { name: 'Sign in' })

  async login(email: string, password: string) {
    await this.emailInput().fill(email)
    await this.passwordInput().fill(password)
    await this.submitButton().click()
  }
}
```

Keep assertions in tests, not page objects.

## Configuration

```typescript
export default defineConfig({
  workers: process.env.CI ? 2 : undefined,
  retries: process.env.CI ? 2 : 0,
  use: { trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ]
})
```

## Common Review Flags

| Issue | Problem |
|-------|---------|
| `waitForTimeout()` | Slow, flaky |
| CSS class selectors | Break on styling |
| `isVisible()` in manual expect | No auto-retry |
| Test depends on other test | Isolation failure |
| No cross-browser testing | Misses browser bugs |
| Hardcoded test data in UI | Slow - use API seeding |
| Assertions in page objects | Obscures intent |
| Missing `await` | Silent failures |
| Vague test names | Doesn't explain scenario |
| Loops/conditionals in tests | Obscures intent |
| Placeholder data ('foo') | Misses edge cases |
| Login in every test | Slow - reuse auth state |

---

## Source: `docs/best-practices/sonar/common-rules.md`

# Sonar way — common rules to write clean first time

The CI SonarCloud scan and the IntelliJ SonarQube plugin both run the
default **Sonar way** profile. These are the rules most often tripped —
write code that passes them up front instead of fixing findings later.

## Both languages

| Rule | Write it this way |
|---|---|
| S3776 | Keep cognitive complexity ≤ 15 per function — extract helpers instead of nesting if/else/loops |
| S1192 | A string literal used 3+ times → named constant |
| S107 | ≤ 7 parameters — introduce a parameter object/record |
| S1172 | No unused function parameters |
| S1854 | No dead stores — don't assign values never read |
| S125 | No commented-out code — delete it, git remembers |
| S1135 | `TODO` must reference a ticket (`// TODO EUDPA-XXX: ...`) |
| S1126 | Return boolean expressions directly, not `if (x) return true; else return false` |
| S2589 | No conditions that are always true/false |
| S4144 | No two methods/functions with identical bodies — extract and share |

## Java

| Rule | Write it this way |
|---|---|
| S3655 | Never `Optional.get()` without `isPresent()` — prefer `map`/`orElse`/`orElseThrow` |
| S2095 | Resources (`InputStream`, clients, etc.) in try-with-resources |
| S106 | No `System.out`/`System.err` — use the logger |
| S1118 | Utility classes get a private constructor |
| S2259 | Guard possible nulls before dereference — `Objects.requireNonNull` at boundaries |
| S1452 | No wildcard generic return types (`List<?>`) |
| S112 | Throw specific exceptions, never bare `RuntimeException`/`Exception` |
| S1948 | Fields of `Serializable` classes must be serializable |
| S5786 | JUnit 5 test classes/methods package-private, no `public` |
| S2699 | Every test has at least one assertion |

## JavaScript

| Rule | Write it this way |
|---|---|
| S6582 | Prefer optional chaining `a?.b` over `a && a.b` |
| S3504 | `const`/`let`, never `var` |
| S1481 | No unused local variables |
| S6571 | No redundant type/truthiness checks the runtime guarantees |
| S2486 | Never swallow exceptions — handle or rethrow with context |
| S4138 | Prefer `for...of` over index loops where index isn't needed |
| S6606 | Prefer `??` over `\|\|` for defaulting (avoids falsy-zero bugs) |
| S3358 | No nested ternaries — extract a function or if/else |
| S1186 | No empty functions without an explaining comment |
| S6079 | Tests: no assertions after the test's done/return path |

## Coverage gate

SonarCloud's quality gate also requires **coverage on new code** —
every new branch/function needs a test exercising it, or the PR fails
the gate even with zero rule findings.
