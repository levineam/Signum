# Continuous Testing CI/CD Pipeline

## Overview

Signum uses a comprehensive GitHub Actions CI/CD pipeline to ensure code quality and catch regressions before they reach production. The pipeline includes linting, type checking, unit tests, E2E tests, and burn-in loops for flaky test detection.

**Pipeline Status**: ![CI Status](https://github.com/levineam/Signum/workflows/Continuous%20Testing/badge.svg)

---

## Pipeline Stages

### 1. Lint & Type Check (< 2 min)

- **ESLint**: Code quality and style checks
- **TypeScript**: Type safety verification
- **When**: Every PR and push to dev/main
- **Command**: `npm run lint && npm run typecheck`

### 2. Unit Tests (< 10 min)

- **Framework**: Vitest
- **Coverage**: Uploads coverage reports on completion
- **When**: Every PR and push to dev/main
- **Command**: `npm run test:unit`

### 3. Build Verification (< 10 min)

- **Framework**: Next.js 15.5.3 with Turbopack
- **Purpose**: Ensure production build succeeds
- **When**: Every PR and push to dev/main
- **Command**: `npm run build`

### 4. E2E Smoke Tests (< 15 min)

- **Framework**: Playwright (Chromium only)
- **Scope**: Critical paths tagged with `@smoke`
- **When**: PRs from non-forked repos only
- **Command**: `npm run test:e2e:smoke`
- **Features**:
  - OpenAI API mocked via `OPENAI_MOCK=1`
  - Artifacts uploaded on failure (traces, screenshots, videos)
  - Browser binary caching for faster runs
  - Deterministic fixtures enabled via `E2E_TEST_MODE=1` / `NEXT_PUBLIC_E2E_TEST_MODE=1` so auth + ontology tests can run without seeded data

### 5. E2E Full Suite (< 30 min)

- **Framework**: Playwright (Chromium only)
- **Scope**: All tests
- **When**: Push to dev/main branches only
- **Command**: `npm run test:e2e -- --project=chromium`

### 6. Burn-in Loop (< 60 min)

- **Purpose**: Detect flaky (non-deterministic) tests
- **Iterations**: 10 full smoke test runs
- **When**: Manual trigger or weekly schedule
- **Command**: See `scripts/burn-in.sh`
- **Failure Criteria**: Even ONE failure = tests are flaky

---

## Performance Targets

| Stage | Target Time | Actual |
|-------|-------------|--------|
| Lint & Type Check | < 2 min | TBD |
| Unit Tests | < 10 min | TBD |
| Build | < 10 min | TBD |
| E2E Smoke | < 15 min | TBD |
| E2E Full Suite | < 30 min | TBD |
| Burn-in Loop | < 60 min | TBD |
| **Total (PR)** | **< 30 min** | **TBD** |

---

## Helper Scripts

### Local CI Mirror

Run the entire CI pipeline locally before pushing:

```bash
./scripts/ci-local.sh
```

**What it does:**
- Lint → Type check → Build → Unit tests → E2E smoke → Burn-in (3 iterations)
- Mirrors CI execution for debugging
- Color-coded output with failure summary

### Selective Testing

Run only tests affected by your changes:

```bash
./scripts/test-changed.sh [base-branch]
```

**What it does:**
- Detects changed files since base branch (default: main)
- Runs only affected tests
- Fallback to smoke tests if no test files changed
- Speeds up local feedback loop

### Burn-in Loop

Run standalone burn-in loop for flaky test detection:

```bash
./scripts/burn-in.sh [iterations] [test-command]
```

**Examples:**
```bash
# Default: 10 iterations of smoke tests
./scripts/burn-in.sh

# Custom iterations
./scripts/burn-in.sh 100

# Custom test command
./scripts/burn-in.sh 10 "npm run test:e2e -- tests/critical.spec.ts"
```

---

## Debugging Failed CI Runs

### 1. Download Failure Artifacts

Go to the failed GitHub Actions run → **Artifacts** section → Download:
- `smoke-test-results` or `e2e-full-results`
- Contains: traces, screenshots, videos, HTML reports

### 2. View Playwright Traces

```bash
npx playwright show-trace test-results/*/trace.zip
```

**Trace viewer shows:**
- Every action taken during the test
- Screenshots at each step
- Network requests and responses
- Console logs and errors
- Timeline with timing information

### 3. Reproduce Locally

Run the specific failing test:

```bash
# Run single test file
npm run test:e2e -- tests/failing-test.spec.ts

# Run with headed mode (see browser)
npm run test:e2e -- tests/failing-test.spec.ts --headed

# Run with debug mode (step through)
npm run test:e2e -- tests/failing-test.spec.ts --debug
```

### 4. Check Environment Differences

CI environment differences:
- **CI=true**: Affects Playwright configuration
- **OPENAI_MOCK=1**: OpenAI API calls are mocked
- **Node 20**: Locked via `.nvmrc`
- **Fresh npm install**: No cached modules
- **Ubuntu Linux**: Different OS than macOS local

Mirror CI environment:
```bash
CI=true OPENAI_MOCK=1 npm run test:e2e:smoke
```

---

## Adding New Tests

### Tagging Smoke Tests

Critical path tests should be tagged with `@smoke`:

```typescript
test('@smoke User can sign in and create journal entry', async ({ page }) => {
  // Test implementation
})
```

**When to use `@smoke` tag:**
- ✅ Authentication flows (sign-in, sign-up)
- ✅ Core features (journal entry creation, note creation)
- ✅ Critical API integrations (AI ontology extraction)
- ✅ Data persistence (auto-save, link creation)
- ❌ Edge cases (can go in full suite)
- ❌ Visual/styling tests (not critical path)

### Test Quality Guidelines

**Do:**
- ✅ Use explicit waits (`page.waitForSelector()`, `expect(locator).toBeVisible()`)
- ✅ Clean up test data after each test
- ✅ Use data-testid attributes for reliable selectors
- ✅ Mock external APIs in CI (OpenAI, Stripe, etc.)

**Don't:**
- ❌ Use arbitrary sleeps (`page.waitForTimeout(5000)`)
- ❌ Depend on test execution order
- ❌ Share state between tests
- ❌ Hard-code timing assumptions

---

## Secrets and Environment Variables

See [CI Secrets Checklist](./ci-secrets-checklist.md) for required secrets and how to configure them.

**Currently Required:**
- None (OpenAI mocked, Supabase test project planned)

**Future Secrets:**
- `SUPABASE_URL` - Test project URL
- `SUPABASE_ANON_KEY` - Test project anonymous key
- `OPENAI_API_KEY` - For real API testing (optional)

---

## CI Optimization Tips

### Reduce CI Time

1. **Add more smoke tests**: Tag critical paths, remove from full suite
2. **Enable parallelism**: Add `--shard` to split tests across jobs
3. **Cache dependencies**: Already enabled (npm + Playwright browsers)
4. **Selective testing**: Use `test-changed.sh` for local development

### Reduce Flakiness

1. **Run burn-in loop**: `./scripts/burn-in.sh 10`
2. **Fix timing issues**: Replace sleeps with explicit waits
3. **Isolate tests**: Clean up data, don't share state
4. **Use stable selectors**: Prefer data-testid over CSS classes

### Reduce Costs

1. **Mock APIs**: Use `OPENAI_MOCK=1` to avoid API charges
2. **Artifact retention**: Set to 30 days (already configured)
3. **Failure-only artifacts**: Don't upload on success (already configured)
4. **Chromium only**: Skip firefox/webkit in CI (already configured)

---

## Monitoring and Alerts

### Test Failure Rate

Track in GitHub Actions dashboard:
- Target: < 5% failure rate on main branch
- Alert: If > 2 consecutive failures on main

### Flaky Test Detection

- Run burn-in loop weekly (cron schedule)
- Alert: If burn-in fails → flaky tests exist
- Action: Fix before merging more changes

### Performance Degradation

- Track CI execution time trends
- Alert: If smoke tests > 20 min or full suite > 40 min
- Action: Add parallelism or optimize slow tests

---

## Troubleshooting

### "Playwright browsers not installed"

```bash
npx playwright install --with-deps chromium
```

### "Module not found" errors in CI

- Cache issue. Add `npm ci` before test commands
- Check if dependencies are in `package.json`

### "Tests pass locally but fail in CI"

- Environment difference. Run `CI=true npm run test:e2e:smoke`
- Check for hardcoded localhost URLs
- Ensure test data is seeded, not relying on local state

### "Artifacts not uploading"

- Check path exists: `test-results/` and `playwright-report/`
- Ensure Playwright reporter is configured correctly
- See `playwright.config.ts` for reporter settings

---

## References

- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Signum Testing Guide](../testing-guide.md)
- [Issue #152: Continuous Testing System](https://github.com/levineam/Signum/issues/152)
