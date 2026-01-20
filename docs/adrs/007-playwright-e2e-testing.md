# ADR 007: Playwright for E2E Testing

## Status
Accepted

## Date
2025-01-01 (retrospective)

## Context

The application needed end-to-end testing that:
- Tests real user flows in a browser
- Works with Next.js development server
- Supports parallel test execution
- Can test API routes
- Provides good debugging tools

## Decision

Use **Playwright** for end-to-end testing with worker-based test data isolation.

### Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 10,
  timeout: 90000,
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  // Currently testing Chromium only
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'PORT=3000 npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_PLAYWRIGHT_TEST_MODE: 'true',
    }
  },
})
```

### NPM Scripts

```json
{
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:headed": "playwright test --headed"
  }
}
```

### Test Structure

```
tests/
├── homepage.spec.ts          # Home page and navigation tests
├── grid-plotter.spec.ts      # Garden planner grid functionality
├── ai-advisor.spec.ts        # AI advisor page tests
└── growing-guides.spec.ts    # Static content pages tests
```

### Example Test

```typescript
// tests/homepage.spec.ts
import { test, expect } from '@playwright/test'

test('homepage has correct title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Bonnie Wee Plot/)
})

test('navigation works', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Garden Planner')
  await expect(page).toHaveURL('/garden-planner')
})
```

## Consequences

### Positive
- **Real browser testing** - Tests actual user experience
- **Parallel execution** - Fast test runs with 10 workers
- **Auto-waiting** - Built-in smart waiting for elements
- **Debugging tools** - UI mode, trace viewer, headed mode
- **Cross-browser capable** - Currently testing Chromium only; Firefox/Safari can be added via config
- **API testing** - Can test API routes directly

### Negative
- **Slower than unit tests** - Requires browser and server
- **Test data complexity** - Need isolation strategy
- **Flakiness potential** - Network and timing issues
- **No component testing** - Need separate tool for unit tests

### Test Isolation Strategy

Tests use localStorage for garden planner data, which is naturally isolated per browser context. Each test clears localStorage in `beforeEach` to ensure clean state.

### Current Coverage

| Area | Tested |
|------|--------|
| Homepage | ✅ |
| Navigation | ✅ |
| Garden Planner Grid | ✅ |
| Growing Guides | ✅ |
| AI Advisor | ✅ (UI tests) |

### Future Improvements

- Add component tests with Vitest or Testing Library
- Add visual regression tests
- Expand AI advisor tests with response mocking



