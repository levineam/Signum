# Issue PRD: Resolve Supabase Security and Performance Advisor Findings

## Overview
Supabase advisor currently reports three security warnings and 58 performance warnings for the `Signum` project database (`project_id: otyvmmgakowcdsxehwox`). The warnings span Postgres configuration, authentication hardening, function safety, indexing, and row-level security design. This PRD defines the work required to address these warnings, reduce operational risk, and restore the database advisor to a clean state.

## Problem Statement
- Security posture is degraded because leaked-password protection is disabled, the Postgres engine is behind on security patches, and the helper function `public.update_updated_at_column` runs with a mutable `search_path`.
- Performance is impacted (or will be at scale) because of missing indexes, redundant row-level security (RLS) policies, repeated per-row `auth.*` function calls inside policies, and unused indexes that get maintained for no benefit.
- Without resolving these issues, the application remains vulnerable to credential-stuffing, may miss critical security updates, and could suffer from avoidable latency and load on Postgres.

## Goals & Success Criteria
- **Goal 1:** Eliminate all outstanding Supabase security warnings for the project.
  - *Success metrics:* Advisor security lint list empty on next run.
- **Goal 2:** Reduce Supabase performance warnings from 58 to 0.
  - *Success metrics:* Advisor performance lint list empty on next run.
- **Goal 3:** Document remediation steps and verify via automated checks (lint/tests) or Supabase advisor rerun.

## Scope
- Enable Supabase Auth leaked password protection.
- Upgrade the Postgres instance off version `supabase-postgres-17.4.1.075` to the latest security-patched release.
- Update `public.update_updated_at_column` to set an explicit `search_path` (or wrap invocation with `set_config`) to prevent search path hijacking.
- Add a covering index for foreign key `journal_templates_user_id_fkey` on `public.journal_templates`.
- Refactor RLS policies on `public.journal_entries`, `public.journal_templates`, `public.notes`, and `public.links` to:
  - Cache `auth.*` lookups using `(select auth.<function>())` pattern.
  - Merge redundant permissive policies per `role`/`action` combination.
- Evaluate unused indexes reported on `public.journal_entries`, `public.notes`, and `public.links`; drop those confirmed unnecessary or instrument to start using them.
- Verify Supabase advisor output after remediation and capture results in project docs (link in changelog or README if appropriate).

## Out of Scope
- Broader schema refactors beyond the reported warnings.
- Non-advisor driven performance tuning (e.g., query rewriting) unless required to close a specific lint.
- Updates to application code unless needed to align with adjusted RLS policies or dropped indexes.

## Proposed Approach
1. **Security fixes**
   - Enable leaked password protection via Supabase dashboard or management API.
   - Schedule and execute the database upgrade (for this prototype, align with a monitored working session rather than a formal maintenance window) and take a fresh backup so you can roll back if needed.
   - Modify `public.update_updated_at_column` with explicit `set search_path` (or `set_config`) to remove mutable search path warning.
2. **RLS policy refactor**
   - For each table and role/action pair, consolidate the permissive policies into a single statement and adopt the `(select auth.*())` pattern.
   - Ensure policy semantics remain unchanged by writing regression tests or running targeted queries.
3. **Index hygiene**
   - Create missing FK index on `journal_templates(user_id)`.
   - Review unused indexes; if they support planned workload, keep and monitor, otherwise drop them carefully (after confirming no existing queries rely on them).
4. **Verification**
   - Re-run Supabase advisor to confirm zero warnings.
   - Update documentation with remediation notes and add monitoring/alerting where applicable.

## Deliverables
- GitHub issue (this ticket) tracking all remediation tasks.
- Database migration scripts (SQL or Supabase migrations) covering function updates, policy changes, and index adjustments.
- Documentation update summarizing applied fixes and verification results.
- Evidence (screenshot/log) of Supabase advisor showing zero security/performance warnings post-remediation.

## Implementation Status
- [x] Migration `supabase/migrations/20251015090000_security_performance_remediation.sql` hardens `update_updated_at_column`, consolidates RLS policies, and restructures indexes.
- [x] Enable Supabase Auth leaked password protection via dashboard (HaveIBeenPwned check enabled).
- [ ] Schedule and execute Postgres upgrade from `supabase-postgres-17.4.1.075` (prototype window; take fresh snapshot beforehand).
- [ ] Re-run Supabase advisor to confirm security/performance warnings resolved and capture evidence.

## Risks & Mitigations
- **Database upgrade risks:** Even without external users the upgrade can fail; mitigate by taking a fresh snapshot/backup beforehand and running the upgrade while you can monitor it.
- **RLS policy consolidation risk:** Behavior regression; mitigate via staging environment validation and targeted integration tests.
- **Unused index removal risk:** Hidden dependencies; mitigate by analyzing query stats and consulting application team before dropping.

## Testing & Validation
- Run automated test suite (`npm run lint`, relevant integration/e2e tests) to confirm no application regressions.
- Execute targeted queries ensuring RLS still enforces correct access.
- Capture before/after Supabase advisor outputs to demonstrate resolution.

## Timeline & Ownership
- Target completion: within the next sprint.
- Dependencies: None external; coordinate personally on upgrade prep and validation.
- Owner: Solo developer (you) handling remediation end to end.
