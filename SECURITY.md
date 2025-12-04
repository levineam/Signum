# Security Policy

## Reporting a vulnerability
- Submit a private report via GitHub Security Advisories: <https://github.com/levineam/Signum/security/advisories/new>
- Include reproduction steps, affected versions/commits, and impact.
- Do **not** open public issues for security reports.

## Response timeline
- Acknowledge receipt: **within 5 business days**
- Initial assessment: **within 10 business days**
- Fix ETA shared after triage; coordinated disclosure encouraged.

## Scope & environments
- `main` branch and released tags are in scope.
- Hosted production instances are out of scope for this repository.

## Handling secrets
- No secret keys should ever be committed.
- Default development (`npm run dev:test`) works without Supabase or OpenAI credentials.
- For full Supabase runs, use a local `.env.local` that is **never** committed.

## Secret scanning
- Recommended before release: `docker run --rm -v $(pwd):/repo zricethezav/gitleaks:latest detect --no-banner --redact --source /repo`
- Run locally and in CI for PRs; redact any findings and rotate affected keys.
