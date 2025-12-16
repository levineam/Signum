# Journal Data Loss Incident — 2025-12-11

## Summary
A production incident caused journal entries older than ~24 hours to disappear for some users. An encryption feature flag (`NEXT_PUBLIC_ENABLE_ENCRYPTION`) was enabled while the production `notes` table lacked the encrypted columns. Writes silently failed; the client then treated entries as empty and a cleanup job deleted "empty" journal entries older than 24 hours.

## Timeline (Eastern Time)
- 2025-12-10: Encryption flag left enabled in production; DB migration for encrypted columns not applied.
- 2025-12-11 09:00: Users reported missing journal history (>1 day old).
- 2025-12-11 14:25: Emergency patch forced plaintext saves and removed client-side cleanup (PR #224 draft).

## Root Cause
- Feature flag enabled without required schema; client attempted to write to non-existent encrypted columns.
- Errors were caught and logged only to console; UI showed no failure, so users kept editing.
- A client cleanup routine deleted “empty” journal entries older than 24h, removing unsaved content.

## Impact
- Journal entries older than 24h for affected accounts were deleted in the Supabase `notes` table (scope under investigation; at least two accounts confirmed).

## Immediate Mitigations
- Disable encryption writes in the client and bypass cleanup logic (PR #224, #225).
- Add UI/console surfacing for save failures to avoid silent loss.

## Follow-Up Actions
- Add runtime schema probe and gate encryption on capability.
- Add alerting for Supabase write failures and for “empty but recently edited” journal entries.
- Provide a PITR/backup restore playbook for targeted `notes` recovery.
- Update release checklist: deploy schema before enabling flags; verify journal retention before rollout.
