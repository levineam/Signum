# CI/CD Secrets Checklist

## Overview

This document tracks all secrets and environment variables required for the Continuous Testing CI/CD pipeline.

**Current Status**: ✅ No secrets required (Phase 1 - OpenAI mocked)

---

## Required Secrets (by Phase)

### Phase 1: Local CI (Current)

**Status**: ✅ Complete

No secrets required. OpenAI API is mocked via `OPENAI_MOCK=1` environment variable.

---

### Phase 2: Supabase Test Environment (Planned)

**When needed**: After setting up dedicated Supabase test project

| Secret Name | Purpose | Where to Get | How to Configure |
|-------------|---------|--------------|------------------|
| `SUPABASE_URL` | Test project URL | Supabase Dashboard → Settings → API | GitHub repo → Settings → Secrets → Actions → New secret |
| `SUPABASE_ANON_KEY` | Test project anonymous key | Supabase Dashboard → Settings → API → anon public | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin access for test data seeding | Supabase Dashboard → Settings → API → service_role (⚠️ secret) | Same as above |

**Setup Instructions:**

1. Create dedicated Supabase test project:
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Name: `signum-test` (or similar)
   - Choose same region as production
   - Note: Free tier includes 500 MB database, sufficient for testing

2. Run database migrations on test project:
   ```bash
   # Set test project connection string
   export SUPABASE_URL="https://your-test-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

   # Run migrations (once setup script is created)
   npm run db:migrate:test
   ```

3. Add secrets to GitHub:
   - Go to https://github.com/levineam/Signum/settings/secrets/actions
   - Click "New repository secret"
   - Add each secret from table above

4. Update CI workflow:
   - Uncomment environment variable lines in `.github/workflows/continuous-testing.yml`
   - Remove `OPENAI_MOCK=1` for real API testing (optional)

---

### Phase 3: Real API Testing (Optional)

**When needed**: After confirming mock testing is insufficient

| Secret Name | Purpose | Where to Get | How to Configure |
|-------------|---------|--------------|------------------|
| `OPENAI_API_KEY` | Real OpenAI API access | OpenAI Dashboard → API Keys | GitHub repo → Settings → Secrets → Actions |

**⚠️ Cost Considerations:**

- Each E2E test run may cost $0.05-0.10 (GPT-4 API calls)
- Smoke tests run on every PR → costs add up quickly
- **Recommendation**: Keep `OPENAI_MOCK=1` for most testing, use real API sparingly

**When to use real API:**
- Pre-production testing (before major release)
- After significant prompt engineering changes
- Monthly "reality check" to ensure mocks are accurate

---

### Phase 4: Vercel Preview Testing (Future)

**When needed**: After implementing Vercel preview deployment testing (Issue #152 Phase 2)

| Secret Name | Purpose | Where to Get | How to Configure |
|-------------|---------|--------------|------------------|
| `VERCEL_TOKEN` | Vercel API access | Vercel Dashboard → Settings → Tokens | GitHub repo → Settings → Secrets → Actions |
| `VERCEL_ORG_ID` | Organization ID | Vercel Dashboard → Settings → General | Same as above |
| `VERCEL_PROJECT_ID` | Project ID | Project Settings → General | Same as above |

---

## Security Best Practices

### Do's ✅

- ✅ Use separate Supabase project for testing (never use production)
- ✅ Rotate secrets if exposed (even accidentally in logs)
- ✅ Use `OPENAI_MOCK=1` by default, real API only when needed
- ✅ Set `if-no-files-found: ignore` on artifact uploads (graceful degradation)
- ✅ Use `if: github.event.pull_request.head.repo.fork == false` to protect secrets from forks

### Don'ts ❌

- ❌ Never commit secrets to git (even in `.env.example`)
- ❌ Never log secrets in CI output (sanitize logs)
- ❌ Never use production Supabase project in CI
- ❌ Never share service role keys (admin access)
- ❌ Never enable real API testing on forked PRs (costs + security risk)

---

## Forked Pull Request Handling

**Problem**: Forked PRs cannot access repository secrets (GitHub security measure)

**Current Solution**: E2E tests are skipped on forked PRs via:
```yaml
if: github.event.pull_request.head.repo.fork == false
```

**Alternative Approaches:**

1. **Manual Approval** (recommended for external contributors):
   - Maintainer reviews code first
   - Closes forked PR
   - Creates new PR from same commits in main repo
   - CI runs with secrets

2. **Fork-Specific CI** (not implemented):
   - Separate workflow for forks
   - Runs only lint + typecheck + build
   - No E2E tests (no secrets required)

3. **Pull Request from Fork** (GitHub feature):
   - Use `pull_request_target` instead of `pull_request`
   - ⚠️ Security risk: Code runs with secrets before review
   - **Not recommended** without additional safety measures

---

## Verification Checklist

Before merging changes that add secret dependencies:

- [ ] Test with mock/fake values first
- [ ] Document secret in this file
- [ ] Add secret to GitHub repo settings
- [ ] Verify CI passes with new secret
- [ ] Ensure secret is not logged in CI output
- [ ] Confirm forked PRs handle missing secret gracefully
- [ ] Add secret to local `.env.local` for manual testing (not committed)
- [ ] Update `README.md` if secret affects local development

---

## Troubleshooting

### "Secret not found" error in CI

1. Check secret name matches exactly (case-sensitive)
2. Verify secret is set in GitHub repo → Settings → Secrets → Actions
3. Ensure workflow has `if: github.event.pull_request.head.repo.fork == false` if running on forked PR

### "API authentication failed" in tests

1. Verify secret value is correct (copy-paste from source)
2. Check for trailing whitespace or newlines in secret value
3. Confirm secret is not expired (some APIs have expiring keys)

### "Rate limit exceeded" from external API

1. Add retry logic with exponential backoff
2. Use mocks for CI, real API only for critical tests
3. Implement request caching where possible

---

## References

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Test Project Setup](https://supabase.com/docs/guides/platform/branching)
- [OpenAI API Key Management](https://platform.openai.com/api-keys)
- [Vercel Deploy Hooks](https://vercel.com/docs/concepts/git/deploy-hooks)
