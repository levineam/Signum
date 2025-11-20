# Testing Decision Matrix

Quick reference for choosing the right testing approach.

## Decision Tree

```
Is this a UI/component change?
├─ YES → npm run dev:test (30 sec iteration)
└─ NO → Does it need database testing?
    ├─ YES → Vercel preview (5-10 min)
    └─ NO → npm run dev:test (30 sec iteration)
```

## Detailed Matrix

| Change Type | Test Locally? | Command | Why |
|-------------|---------------|---------|-----|
| React component styling | ✅ Yes | `npm run dev:test` | No DB needed |
| Component interaction logic | ✅ Yes | `npm run dev:test` | State management only |
| Editor features | ✅ Yes | `npm run dev:test` | DOM manipulation |
| Modal/dialog behavior | ✅ Yes | `npm run dev:test` | UI flow |
| Form validation | ✅ Yes | `npm run dev:test` | Client-side logic |
| E2E test development | ✅ Yes | `npm run test:e2e` | Already uses test mode |
| Database schema changes | ❌ No | Push → Vercel | Needs real Supabase |
| RLS policy updates | ❌ No | Push → Vercel | Needs real Supabase |
| Supabase function changes | ❌ No | Push → Vercel | Needs real Supabase |
| Ontology extraction | ❌ No | Push → Vercel | Needs embeddings |
| API route changes | ⚠️ Maybe | Try `dev:test` first | Depends on DB usage |

## Mode Characteristics

### Test Mode (`npm run dev:test`)

**Pros:**
- Instant startup (no Supabase connection)
- 30-second iteration cycles
- No credentials needed
- Perfect for UI work
- Visual "Test Mode" banner in sidebar

**Cons:**
- Data doesn't persist (resets on refresh)
- Can't test real DB operations
- No Supabase features (embeddings, etc.)

**When to Use:**
- 80% of development work
- Any UI/component change
- E2E test development
- Quick prototyping

### Full Mode (`npm run dev`)

**Pros:**
- Full Supabase integration
- Real database persistence
- All features work

**Cons:**
- Requires `.env.local` setup
- Slower startup
- Network dependency

**When to Use:**
- DB schema testing
- RLS policy validation
- Supabase feature development

### Vercel Preview

**Pros:**
- Production-like environment
- Real Supabase instance
- No local setup needed
- Shareable with team

**Cons:**
- 5-10 minute iteration cycles
- Requires GitHub push
- Slower feedback

**When to Use:**
- Final validation before merge
- Database-dependent features
- Team collaboration/review
- When local auth fails

## Recommended Workflow

### Typical Feature Development

```bash
# 1. Start in test mode for UI work
npm run dev:test

# 2. Build and test UI quickly
# (Make changes, auto-reload, iterate)

# 3. When UI is solid, test integration
git push origin feature-branch

# 4. Validate on Vercel preview
# (Test DB integration, full flow)

# 5. Merge when preview tests pass
```

### Bug Fix Workflow

```bash
# 1. Reproduce locally if possible
npm run dev:test

# 2. Fix and verify locally
# (Fast iteration until fixed)

# 3. Validate on Vercel preview
git push origin fix-branch

# 4. Merge when verified
```

## How AI Assistants Should Use This

When user asks to implement a feature:

1. **Analyze the change type**
   - Does it touch Supabase directly?
   - Is it primarily UI/UX?
   - What's the testing strategy?

2. **Recommend the appropriate mode**
   - Default to `npm run dev:test` unless DB testing required
   - Explain why that mode was chosen
   - Mention when to validate on Vercel

3. **Set expectations**
   - Test mode: "Fast local iteration, validate on Vercel before merge"
   - Full mode: "Full DB testing, slower but complete"
   - Vercel only: "DB-dependent, use preview deployments"

## Examples

### Example 1: Add a Button to Journal Page

**Analysis:** UI change, no DB needed  
**Recommendation:** `npm run dev:test`  
**Workflow:**
```bash
npm run dev:test
# Edit src/components/journal/JournalStream.tsx
# Test in browser (auto-reload)
# Push when satisfied
# Final check on Vercel preview
```

### Example 2: Add RLS Policy

**Analysis:** Database change, requires real Supabase  
**Recommendation:** Vercel preview only  
**Workflow:**
```bash
# Edit supabase/migrations/new_policy.sql
git add . && git commit -m "feat: add RLS policy"
git push origin feature-branch
# Test on Vercel preview with real Supabase
```

### Example 3: Add Note Filtering UI

**Analysis:** UI + client-side logic, minimal DB  
**Recommendation:** Start with `npm run dev:test`, validate on Vercel  
**Workflow:**
```bash
npm run dev:test
# Build filtering UI and logic locally
# Test with local notes (fast iteration)
git push origin feature-branch
# Validate filtering works with real DB on Vercel
```

## Success Metrics

After implementing this workflow, you should see:

- 50%+ reduction in Vercel preview iterations
- Faster feature development (local iteration)
- Fewer review comment cycles (test edge cases locally)
- Better separation of UI vs. DB testing

## Questions?

See `docs/runbooks/local-testing-guide.md` for detailed setup and troubleshooting.

