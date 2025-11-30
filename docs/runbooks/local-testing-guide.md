# Local Testing Without Supabase

## Quick Start

1. Start dev server: `npm run dev:test`
2. Open http://localhost:3000
3. Page automatically loads with test user enabled
4. Test your changes with instant feedback

## Alternative: Manual Test Mode Activation

If you prefer to start the regular dev server:

1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. In browser console: `sessionStorage.setItem('__signum_force_test_user__', '1')`
4. Refresh page → now "logged in" with test user
5. Test your changes with instant feedback

## What Works in This Mode

- All auth flows (sign in, sign out, session persistence)
- Journal entry creation/editing (local state, not persisted to DB)
- Note creation with "Make Note" (local-only notes)
- UI flows, component rendering, interactions
- Playwright E2E tests (already configured with `loginAsTestUser` helper)
- Fast iteration cycles (30 seconds vs 5-10 minutes on Vercel)

## What Doesn't Work

- Real database persistence (notes disappear on refresh)
- Supabase-dependent features (ontology extraction, embeddings)
- Cross-device sync
- Testing actual database queries and RLS policies

## When to Use This Mode

Use local test mode for:

- UI changes (editor, modals, layouts, styling)
- Component interaction flows
- E2E test development
- Quick iteration on non-DB logic
- React state management changes
- Event handler testing

Use Vercel previews for:

- Database schema changes
- RLS policy testing
- Supabase integration features
- Full end-to-end validation
- Production-like environment testing

## How It Works

The forced test user mode:

1. Creates a stub user object without Supabase
2. Routes all data operations to local fallback implementations
3. Uses `hasPublicSupabase()` checks to skip remote calls
4. Provides instant feedback without network latency

## Testing Workflow

### Typical UI Change

```bash
# 1. Start test mode
npm run dev:test

# 2. Make your code changes
# Edit files in src/components, etc.

# 3. Test in browser (auto-reloads)
# Verify UI, interactions, flows

# 4. Run E2E tests locally
npm run test:e2e

# 5. When satisfied, push to GitHub
git add . && git commit -m "feat: your change"
git push

# 6. Final validation on Vercel preview (if needed)
```

### Playwright E2E Development

#### Quick Start (Two Approaches)

**Approach 1: Auto-start (CI/Vercel style)**
```bash
# Runs production build + all browsers (slow, ~2 min startup)
npm run test:e2e
```

**Approach 2: Manual server (Local development)**
```bash
# Terminal 1: Start test mode server
npm run dev:test

# Terminal 2: Run tests against existing server (fast, <5s startup)
npx playwright test --config=playwright.config.noserver.ts

# Or run specific test
npx playwright test tests/ontology-inline-editing.spec.ts --config=playwright.config.noserver.ts

# Debug mode
npx playwright test --headed --debug --config=playwright.config.noserver.ts
```

#### When to Use Which Config

| Config | Server | Browsers | Use For |
|--------|--------|----------|---------|
| `playwright.config.noserver.ts` | Assumes running on :3000 | Chromium only | **Local dev** (fast iteration) |
| `playwright.config.ts` (default) | Auto-starts production build | Chrome, Firefox, Safari | **CI/Vercel** (full validation) |

#### Common Commands

```bash
# Run single test file (fast)
npx playwright test tests/hyperlink.test.ts --config=playwright.config.noserver.ts

# Run tests matching pattern
npx playwright test --grep="click-to-edit" --config=playwright.config.noserver.ts

# Run smoke tests only
npx playwright test --grep=@smoke --config=playwright.config.noserver.ts

# Debug with browser visible
npx playwright test --headed --debug --config=playwright.config.noserver.ts
```

#### Troubleshooting

**Issue: "Timed out waiting 120000ms from config.webServer"**
- Using default config which tries to build production bundle
- **Fix**: Use `--config=playwright.config.noserver.ts` and ensure `npm run dev:test` is running

**Issue: "net::ERR_ABORTED at http://localhost:3000"**
- Dev server not running or wrong port
- **Fix**: Check `npm run dev:test` is active in another terminal

**Issue: Port 3000 already in use**
```bash
# Kill existing process
kill $(lsof -ti:3000)
# Restart
npm run dev:test
```

## Troubleshooting

### Issue: Changes don't appear

- Check that dev server is running
- Verify file was saved
- Check browser console for errors
- Try hard refresh (Cmd+Shift+R)

### Issue: Test user not working

- Check console for: `[AuthContext] Forcing test-mode user session`
- Verify sessionStorage flag: `sessionStorage.getItem('__signum_force_test_user__')`
- Try restarting dev server

### Issue: Need real database for testing

- Use Vercel preview deployment
- Or consider setting up local Supabase (see Phase 3 in plan)

## Visual Indicator

When test mode is active, the sidebar shows a warning banner at the top indicating "Test Mode Active" with a tooltip explaining that test data won't persist.

## Disabling Test Mode

To return to normal mode:

```bash
# 1. Stop dev:test server (Ctrl+C)

# 2. Clear sessionStorage flag in browser console
sessionStorage.removeItem('__signum_force_test_user__')

# 3. Restart normal dev server
npm run dev
```

Or simply use `npm run dev` instead of `npm run dev:test`.

