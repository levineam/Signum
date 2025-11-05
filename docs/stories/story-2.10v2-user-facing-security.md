# Story 2.10v2: User-Facing Security & Transparency (Notion Model)

**Status:** ⏸️ DEFERRED (Post-Launch)
**Priority:** P3 (Nice-to-Have - Defer until users request it)
**Created:** 2025-11-04
**GitHub Issue:** [#110](https://github.com/levineam/Signum/issues/110) (Pivoted from E2E encryption)
**Prerequisites:**
- Story 2.4.6 (Production Security Hardening) ✅ Complete (PR #145)

---

## Story

As a **privacy-conscious user**,
I want **transparency about who can access my data and when they do**,
so that **I can trust the platform with my personal reflections** even though the platform can technically access my content.

---

## Context & Strategic Pivot

### Original Approach (Abandoned)
**Story 2.10 (E2E Encryption):** Implement client-side encryption so developer CANNOT access user data.

**Why Abandoned:**
- ❌ Breaks AI features (can't analyze encrypted text)
- ❌ Breaks search (can't index encrypted content)
- ❌ High complexity (key management, migration, rollback)
- ❌ User experience issues (lost device = lost data)
- ❌ Supabase discourages column encryption
- ❌ Not how successful products (Notion, Google Docs, Evernote) work

### New Approach: The Notion Model

**Research Finding:** Notion does NOT use end-to-end encryption. Instead, they use **organizational security**:

| Feature | Notion | Signum (Current) | Signum (After This Story) |
|---------|--------|------------------|---------------------------|
| Encryption at rest | ✅ AES-256 | ✅ Supabase | ✅ Supabase |
| HTTPS in transit | ✅ | ✅ | ✅ |
| User isolation (RLS) | ✅ | ✅ | ✅ |
| Can admins access data? | ✅ Yes (but don't) | ✅ Yes | ✅ Yes |
| **Audit logging** | ✅ | ❌ No | ✅ **YES** |
| **Transparency** | ✅ Clear policy | ❌ No policy | ✅ **YES** |
| **User controls** | ✅ Export, logs | ❌ No | ✅ **YES** |
| **Support consent** | ✅ Time-limited | ❌ No | ✅ **YES** |
| E2E encryption | ❌ No | ❌ No | ❌ No |

**Key Insight:** Users trust Notion because they're **transparent and accountable**, not because of cryptography.

---

## What We Already Have (From Story 2.4.6)

✅ **Removed prototype backdoor** - No unauthorized access paths
✅ **Hardened RLS policies** - User-to-user isolation enforced
✅ **Structured logging (Pino)** - Developer audit trail exists
✅ **Security baseline docs** - Technical foundation documented

**What's Missing:** User-facing features to build trust.

---

## Goals

1. **Make admin access auditable** - Users can see if/when admins accessed their data
2. **Be transparent** - Clear privacy policy explaining data access
3. **Respect user ownership** - Export all your data anytime
4. **Controlled support** - Users approve support access with time limits

---

## Acceptance Criteria

### Phase 1: Audit Logs Visible to Users (Week 1)

**AC1:** Create `audit_events` table
```sql
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  event_type TEXT NOT NULL, -- 'admin_access', 'data_export', 'support_access', 'support_revoke'
  actor_email TEXT,          -- Who performed the action (admin email)
  actor_role TEXT,           -- 'admin', 'support', 'user'
  reason TEXT,               -- Why this action was taken
  ip_address TEXT,           -- Source IP for security tracking
  user_agent TEXT,           -- Browser/client info
  resource_type TEXT,        -- 'notes', 'tasks', 'all_data'
  resource_ids TEXT[],       -- Specific note IDs accessed (if applicable)
  metadata JSONB,            -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only see their own audit events
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit events"
  ON audit_events FOR SELECT
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_audit_events_user_created
  ON audit_events(user_id, created_at DESC);
```

**AC2:** Middleware logs admin data access
- Create `src/middleware/auditLogger.ts`
- Intercept Supabase service role queries
- Log to `audit_events` table when admin accesses user data
- Include: actor email, reason, timestamp, IP address

**AC3:** API route for viewing audit logs
- Endpoint: `GET /api/user/audit-logs`
- Returns user's audit events (most recent 100)
- Filtered by event type (optional query param)
- Paginated response

**AC4:** Audit log UI in settings
- Page: `/settings/privacy` → "Activity & Access" section
- Shows table of recent audit events
- Columns: Date, Action, Actor, Reason
- Empty state: "No admin access to your data"
- Filters: All events / Admin access only / Data exports

---

### Phase 2: Privacy Policy & Transparency (Week 1)

**AC5:** Privacy policy page
- Route: `/privacy` (public page)
- Clear sections:
  - What data we collect
  - How we use it
  - **Who can access your data** (key section)
  - Your rights (export, delete, view access logs)
  - Security measures
  - Contact for questions
- Written in plain English (not legal jargon)

**AC6:** Privacy policy explains data access
- Section: "Admin Access Policy"
- Clear statement: "Our administrators CAN technically access your data, but DON'T without a valid reason"
- Valid reasons listed:
  - Support request (you asked for help)
  - Critical bug investigation (with notification)
  - Legal compliance (court order)
  - Security incident response
- Link to audit logs: "You can see all access in your Activity Log"

**AC7:** Link privacy policy in app
- Footer link on all pages
- Link in settings → privacy section
- Link during signup flow
- Updated "Learn more" in privacy settings

---

### Phase 3: Data Export (Week 2)

**AC8:** Data export API
- Endpoint: `POST /api/user/export`
- Exports all user data:
  - Journal entries
  - Notes
  - Tasks
  - Ontology data
  - Audit logs
- Format: JSON (structured) + Markdown (readable)
- ZIP file with organized folders

**AC9:** Data export UI
- Page: `/settings/data` → "Export Your Data" section
- Button: "Download All My Data"
- Shows: Last export date (if any)
- Progress indicator during export
- Downloads ZIP file
- Logs export event to `audit_events`

**AC10:** Export format is portable
- JSON files match our API schema (could be re-imported)
- Markdown files are human-readable
- README.txt explains folder structure
- Timestamps in ISO 8601 format

---

### Phase 4: Support Access Consent (Week 2-3)

**AC11:** Support access request flow
- Support creates time-limited access token (24-48 hours)
- User receives email: "Support requested access to your account"
- Email contains: Reason, duration, approve/deny links
- User can approve or deny via email link
- Approved access logged to `audit_events`

**AC12:** Support access token system
- Database table: `support_access_tokens`
```sql
CREATE TABLE support_access_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  support_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'revoked', 'expired'
  access_scope TEXT[] DEFAULT ARRAY['read_notes', 'read_tasks'], -- What they can access
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**AC13:** User can revoke support access
- UI in `/settings/privacy` → "Active Support Sessions"
- Shows currently active support access (if any)
- Button: "Revoke Access" (terminates immediately)
- Logs revocation to `audit_events`

**AC14:** Support dashboard for admins
- Internal page: `/admin/support-access` (admin-only)
- Request access for a user (enter user email + reason)
- View pending/active/expired access grants
- Cannot access without user approval

---

## Success Metrics

### Trust Metrics
- **Privacy policy views:** Track unique visitors
- **Audit log views:** % of users who check their activity log
- **Data export usage:** # of exports per month
- **Support access:** Approval rate for support requests

### Transparency Metrics
- **Zero unauthorized access:** All admin data access is logged
- **Audit completeness:** 100% of admin queries logged to `audit_events`
- **User awareness:** Survey: "Do you know if admins can access your data?" (target: 80% yes)

### Adoption Metrics
- **Export feature:** 10% of users export data within 90 days
- **Audit log checks:** 20% of users view audit logs within 30 days
- **Support access:** 90%+ approval rate (indicates trust)

---

## Implementation Plan

### Week 1: Foundation (AC1-AC7)
**Days 1-2:** Database schema + audit logging
- Create `audit_events` table
- Build audit logger middleware
- Wire into Supabase service role client
- API endpoint for viewing logs

**Days 3-4:** UI for audit logs
- `/settings/privacy` page enhancements
- Audit log table component
- Activity & Access section
- Empty states and filters

**Day 5:** Privacy policy
- Write privacy policy content
- Create `/privacy` page
- Link throughout app
- Review & publish

### Week 2: User Controls (AC8-AC10)
**Days 1-2:** Data export backend
- Export API endpoint
- Generate JSON + Markdown
- Create ZIP archive
- Handle large datasets

**Days 3-4:** Data export UI
- `/settings/data` page
- Export button + progress
- Download handling
- Test with real data

**Day 5:** Testing & polish
- Test export with various data sizes
- Verify audit logging works
- Cross-browser testing

### Week 3: Support Access (AC11-AC14)
**Days 1-2:** Support access backend
- `support_access_tokens` table
- Token generation API
- Email notifications (approve/deny links)
- Token validation

**Days 3-4:** Support access UI
- User approval flow
- Active sessions display
- Revoke access button
- Admin support dashboard

**Day 5:** Integration & testing
- End-to-end support flow test
- Verify all events logged
- Documentation for support team

---

## Technical Design

### Audit Logger Middleware

```typescript
// src/middleware/auditLogger.ts

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

export async function logAdminAccess(params: {
  userId: string
  actorEmail: string
  eventType: 'admin_access' | 'data_export' | 'support_access'
  reason: string
  resourceType?: string
  resourceIds?: string[]
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { error } = await supabase.from('audit_events').insert({
      user_id: params.userId,
      event_type: params.eventType,
      actor_email: params.actorEmail,
      actor_role: 'admin', // or 'support', 'user'
      reason: params.reason,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      resource_type: params.resourceType,
      resource_ids: params.resourceIds,
      metadata: params.metadata,
    })

    if (error) {
      logger.error({ error, params }, 'Failed to log audit event')
    } else {
      logger.info({ userId: params.userId, eventType: params.eventType }, 'Audit event logged')
    }
  } catch (err) {
    logger.error({ err, params }, 'Exception while logging audit event')
  }
}
```

### Data Export Structure

```
signum-export-2025-11-04.zip
├── README.txt                    # Explains folder structure
├── journal/
│   ├── entries.json              # All journal entries (structured)
│   └── entries.md                # All journal entries (readable)
├── notes/
│   ├── notes.json                # All notes (structured)
│   └── notes/                    # Individual markdown files
│       ├── note-1.md
│       └── note-2.md
├── tasks/
│   └── tasks.json                # All tasks
├── ontology/
│   └── ontology.json             # Extracted concepts
└── audit/
    └── audit-logs.json           # Your access history
```

### Support Access Email Template

```html
Subject: Support Access Request for Your Signum Account

Hi there,

A Signum support team member has requested temporary access to your account to help resolve an issue.

Details:
- Support Agent: support@signum.com
- Reason: "Help troubleshoot note sync issue"
- Requested Access: Read notes and tasks
- Duration: 48 hours

To approve this request, click here: [Approve Access]
To deny this request, click here: [Deny Access]

You can revoke access at any time in your Privacy Settings.

If you didn't request support, please deny this request and contact us immediately.

Thanks,
The Signum Team
```

---

## What This Story Does NOT Include

**Deferred to Future Stories:**
- ❌ SOC 2 / ISO 27001 certification (12+ months, expensive)
- ❌ Third-party security audit (post-launch, $10k+)
- ❌ Advanced monitoring integrations (Datadog, Sentry)
- ❌ Account deletion flow (GDPR right to erasure)
- ❌ End-to-end encryption (re-evaluate for enterprise tier)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Users misunderstand policy** | Low trust | Clear, simple language. No legal jargon. |
| **Audit logging fails silently** | Compliance issue | Alert on logging failures. Retry logic. |
| **Export feature abused** | Server load | Rate limit to 1 export/hour per user. |
| **Support access too complex** | Support friction | Simple email approval flow. Auto-expire. |
| **Users want E2E encryption** | Feature requests | Explain tradeoffs. Consider for enterprise tier. |

---

## Testing Strategy

### Manual Testing
1. **Audit Logs:**
   - Admin uses service role to query user data
   - Verify event appears in user's audit log UI
   - Check all fields populated correctly

2. **Privacy Policy:**
   - Read through for clarity
   - Verify all links work
   - Check mobile rendering

3. **Data Export:**
   - Export with 100+ notes
   - Verify ZIP downloads
   - Unzip and check folder structure
   - Read markdown files for accuracy

4. **Support Access:**
   - Request support access for test user
   - Check email received
   - Approve via email link
   - Verify access works
   - Revoke access, verify it stops

### Automated Testing
```typescript
// tests/e2e/audit-logging.spec.ts

test('admin access is logged to audit events', async () => {
  // Use service role to access user data
  await adminClient.from('notes').select().eq('user_id', testUserId)

  // Check audit event created
  const events = await userClient.from('audit_events').select()
  expect(events.data).toHaveLength(1)
  expect(events.data[0].event_type).toBe('admin_access')
  expect(events.data[0].actor_role).toBe('admin')
})

test('user can export all their data', async () => {
  const response = await fetch('/api/user/export', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` }
  })

  expect(response.ok).toBe(true)
  expect(response.headers.get('content-type')).toBe('application/zip')

  const blob = await response.blob()
  expect(blob.size).toBeGreaterThan(0)
})
```

---

## Documentation

### User-Facing Docs
- Privacy policy at `/privacy`
- Help article: "Who can see my data?"
- Help article: "How to export your data"
- Help article: "Understanding your activity log"

### Developer Docs
- `docs/SECURITY_BASELINE.md` (update with new features)
- `docs/AUDIT_LOGGING.md` (how audit system works)
- `docs/SUPPORT_ACCESS_FLOW.md` (support team guide)

---

## Definition of Done

- [ ] All 14 acceptance criteria met
- [ ] Database migrations applied to dev/staging
- [ ] Audit logging verified end-to-end
- [ ] Privacy policy reviewed and published
- [ ] Data export tested with 1000+ notes
- [ ] Support access flow tested with real emails
- [ ] RLS policies prevent cross-user access to audit logs
- [ ] Code reviewed and approved
- [ ] E2E tests pass
- [ ] Documentation complete
- [ ] Feature flag for gradual rollout (if needed)
- [ ] Deployed to production
- [ ] Support team trained on new features

---

## Related Documents

- **GitHub Issue:** [#110 - User Privacy & Security Audit](https://github.com/levineam/Signum/issues/110)
- **Prerequisite:** Story 2.4.6 (Production Security Hardening) - PR #145
- **Supersedes:** Story 2.10 (E2E Encryption) - Archived in `archive/e2e-encryption-phase1`
- **Research:** Claude Code report on Notion's security model
- **Security Baseline:** `docs/SECURITY_BASELINE.md`

---

## Estimated Effort

**Total:** 2-3 weeks (1 engineer)

- **Week 1:** Audit logs + Privacy policy (AC1-AC7) - 5 days
- **Week 2:** Data export (AC8-AC10) - 5 days
- **Week 3:** Support access consent (AC11-AC14) - 5 days

**Complexity:** Medium
- **Technical:** Medium (new table, middleware, email flow)
- **UX:** Low (simple tables and buttons)
- **Testing:** Medium (need to verify audit logging works)

---

## Notes

- This is the "Notion model" approach: **transparency over cryptography**
- Much simpler than E2E encryption (2-3 weeks vs 6-8 weeks)
- Keeps AI features working (no encryption blocking analysis)
- Builds user trust through accountability, not technical barriers
- Can still add E2E encryption later for enterprise tier if customers demand it
- Research shows this is how successful products (Notion, Google Docs, Evernote) handle privacy

---

**Story Author:** Claude (Dev Agent)
**Date Created:** 2025-11-04
**Last Updated:** 2025-11-04
**Based On:** Claude Code research into Notion's security model
