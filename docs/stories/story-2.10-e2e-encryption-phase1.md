# Story 2.10: End-to-End Encryption Phase 1

<!-- Source: GitHub Issue #110 - User Privacy & Security Audit -->
<!-- Context: Security enhancement - End-to-end encryption for user notes -->
<!-- Issue: https://github.com/levineam/Signum/issues/110 -->

## Status: Approved

## Story

As a **privacy-conscious user**,
I want **my journal entries and notes to be encrypted end-to-end with a key only I control**,
so that **no one, including the developer, can read my private reflections**.

## Context Source

- **Source Document:** `docs/technical-design/e2e-encryption-with-ai-analysis.md`
- **GitHub Issue:** #110 - Ensure Maximum User Privacy & Security
- **Enhancement Type:** Security - Client-side encryption
- **Existing System Impact:** All note CRUD operations, database schema
- **Dependencies:** None (foundational security feature)

---

## Background

### Current State (CRITICAL PRIVACY ISSUE)

**Developer can currently access all user notes:**
- Notes stored in **plain text** in Supabase PostgreSQL
- Service role key bypasses all Row-Level Security (RLS) policies
- Direct database access via Supabase Dashboard
- User content sent to OpenAI API for ontology extraction

**Security findings:**
- ✅ Strong RLS policies prevent user-to-user access
- ✅ Authentication-first pattern in all API routes
- ❌ **No end-to-end encryption** - server has access to all content
- ❌ **Developer access unrestricted** via service role key
- ❌ Prototype user backdoor still present (`00000000-0000-0000-0000-000000000000`)

### Privacy Goal

**Zero developer access to user notes by default.**

Users must have confidence that their personal reflections, journal entries, and ontology data remain completely private. This is foundational for trust in a journaling platform.

### Two-Phase Approach

**Phase 1 (This Story):** Encryption-only release (2-3 weeks)
- Enable E2E encryption ASAP
- Users get privacy guarantees immediately
- AI analysis features temporarily disabled

**Phase 2 (Future Story):** AI analysis with consent (3-4 weeks later)
- Add consent dialog for AI analysis
- Client-side decryption before API calls
- Audit logging for transparency

**Rationale:** This approach delivers privacy protection in weeks instead of months, while preserving the full AI vision for a later release.

---

## Acceptance Criteria

### Core Encryption (Week 1)

**AC1:** Client-side encryption utilities implemented
- `src/lib/crypto/encryption.ts` created with AES-256-GCM functions
- `encryptNote(plainText, key)` returns `{ ciphertext, iv, version }`
- `decryptNote(encrypted, key)` returns plain text
- Each encryption uses unique random IV (12 bytes for AES-GCM)
- Helper functions for base64 encoding/decoding

**AC2:** Key management system functional
- `src/lib/crypto/keyManagement.ts` created
- `generateUserKey()` creates 256-bit AES-GCM key
- `initializeEncryptionForUser(userId)` auto-called on signup to generate and store key
- `getUserEncryptionKey(userId)` retrieves key from IndexedDB
- `storeUserKey(userId, key)` persists key in browser
- Keys stored as JWK (JSON Web Key) format
- Signup flow integration: key auto-generated after successful registration

**AC3:** Database schema updated
- Migration `20251101000000_add_encryption_fields.sql` created
- `notes` table has new columns:
  - `encryption_version INTEGER` (NULL = plain text, 1 = AES-256-GCM)
  - `encrypted_title TEXT`
  - `title_iv TEXT` (base64-encoded IV for title)
  - `encrypted_content TEXT`
  - `content_iv TEXT` (base64-encoded IV for content)
- Index created: `idx_notes_encryption_version ON notes(user_id, encryption_version)`
- Comments added documenting encryption fields

**AC4:** Note CRUD operations use encryption
- `src/lib/notes/encrypted-operations.ts` created
- `saveEncryptedNote()` encrypts title and content with separate IVs before saving
- `getDecryptedNote()` fetches and decrypts note automatically
- Backward compatibility: handles both encrypted and legacy plain text notes
- Error handling for decryption failures

**AC5:** Unit tests pass
- Test encryption/decryption round-trip
- Test different ciphertexts for same plaintext (unique IVs)
- Test decryption fails with wrong key
- Test backward compatibility with plain text notes
- Performance test: encrypt/decrypt 100 notes < 500ms

### Migration & UI (Week 2)

**AC6:** Migration script for existing notes
- `src/lib/notes/migration.ts` created
- `migrateNoteToEncrypted(noteId, title, content, key)` encrypts both fields
- `migrateAllUserNotes(userId)` batch processes all plain text notes
- Progress tracking: `X of Y notes encrypted...`
- Clears legacy `title` and `content` columns after encryption
- Rollback capability if migration fails mid-way

**AC7:** Migration runs on user opt-in
- Settings page shows "Enable Encryption" button
- Clicking shows confirmation dialog with explanation
- After confirmation, generates key and runs migration
- Shows progress bar during migration
- Success message: "✅ All notes encrypted. You can now trust your privacy."
- Migration is one-way (cannot revert to plain text)

**AC8:** UI indicates encryption status
- Badge component shows "🔒 Encrypted" on encrypted notes
- Settings page displays encryption status:
  - ✅ "End-to-End Encryption Enabled" (if enabled)
  - ⚠️ "Encryption Not Enabled" (if still plain text)
- Privacy settings page created at `/settings/privacy`

**AC9:** Feature flag for gradual rollout
- Environment variable `ENABLE_ENCRYPTION` controls availability
- When disabled, encryption features hidden from UI
- Allows testing with alpha users before broad rollout

### Testing & Polish (Week 3)

**AC10:** End-to-end testing complete
- New user signup → auto-generates encryption key
- Write note → encrypted in database (verify ciphertext is gibberish)
- Read note → decrypts automatically (verify readable in UI)
- Logout → key cleared from memory
- Login → key restored from IndexedDB
- Multiple devices: second device cannot decrypt (key not synced yet)

**AC11:** Performance validated
- Encrypt/decrypt 1000 notes in < 2 seconds
- No perceivable lag when opening encrypted notes
- UI remains responsive during batch migration
- Memory usage acceptable (test with 10,000 notes)

**AC12:** Security hardening
- HTTPS enforced (encryption keys never transmitted over HTTP)
- Content Security Policy (CSP) headers configured
- IndexedDB keys origin-isolated
- No encryption keys in browser console/logs
- No plain text in browser DevTools Network tab

**AC13:** Privacy policy updated
- New section: "End-to-End Encryption"
- Explains: "Your notes are encrypted using AES-256-GCM. Only you hold the decryption key."
- Notes AI features temporarily disabled: "AI analysis features are currently disabled while we ensure your privacy is protected."
- Links to technical design doc for transparency

**AC14:** Documentation complete
- Update README with encryption feature
- Technical design doc finalized
- Migration runbook for support team
- FAQ: "What happens if I lose my device?" (Phase 1: data loss, Phase 2: recovery)

---

## What's NOT Included (Phase 2)

**Deferred to Story 2.11 (AI Analysis with Consent):**
- ❌ Consent dialog for AI analysis
- ❌ "Analyze with AI" button
- ❌ Client-side decryption for API calls
- ❌ `/api/ontology-extract` modifications
- ❌ `ai_analysis_audit` table and audit logging
- ❌ Privacy dashboard with AI analysis history
- ❌ OpenAI gpt-5-mini integration

**Deferred to Story 2.12 (Key Recovery):**
- ❌ Password-wrapped key backup
- ❌ Key recovery flow for new devices
- ❌ Multi-device key sync

**Deferred to Story 2.13 (GDPR Compliance):**
- ❌ Data export feature (encrypted export format)
- ❌ Account deletion feature
- ❌ Third-party security audit

---

## Dev Technical Guidance

### Encryption Implementation

#### Web Crypto API Usage

```typescript
// /src/lib/crypto/encryption.ts

export interface EncryptedData {
  ciphertext: string // Base64-encoded
  iv: string // Base64-encoded initialization vector
  version: number // 1 = AES-256-GCM
}

export async function encryptNote(
  plainText: string,
  key: CryptoKey
): Promise<EncryptedData> {
  // Generate random IV (12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Convert string to bytes
  const encoder = new TextEncoder()
  const data = encoder.encode(plainText)

  // Encrypt using Web Crypto API
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  )

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    version: 1,
  }
}

export async function decryptNote(
  encrypted: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext)
  const iv = base64ToArrayBuffer(encrypted.iv)

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  )

  const decoder = new TextDecoder()
  return decoder.decode(plaintext)
}
```

#### Key Management

```typescript
// /src/lib/crypto/keyManagement.ts

export async function generateUserKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )
}

export async function storeUserKey(userId: string, key: CryptoKey): Promise<void> {
  const jwk = await crypto.subtle.exportKey('jwk', key)

  // Store in IndexedDB (persistent across sessions)
  const db = await openDB('signum-encryption', 1, {
    upgrade(db) {
      db.createObjectStore('keys')
    },
  })

  await db.put('keys', jwk, userId)
}

export async function getUserEncryptionKey(userId: string): Promise<CryptoKey> {
  const db = await openDB('signum-encryption', 1)
  const jwk = await db.get('keys', userId)

  if (!jwk) {
    throw new Error('Encryption key not found. Please enable encryption.')
  }

  return await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

export async function initializeEncryptionForUser(userId: string): Promise<void> {
  // Generate new encryption key
  const key = await generateUserKey()

  // Store in IndexedDB
  await storeUserKey(userId, key)
}
```

#### Signup Flow Integration

**CRITICAL: Key generation MUST happen client-side only.**

The encryption key is generated using browser-only APIs (Web Crypto API) and stored in IndexedDB. This code cannot run on the server because:
1. IndexedDB is not available in server-side API routes
2. Keys generated on the server would be visible to the operator (defeating end-to-end encryption)
3. The Web Crypto API behavior differs between Node.js and browsers

**Correct implementation (client-side):**

```typescript
// /src/components/auth/SignupForm.tsx

async function handleSignup(email: string, password: string) {
  // Create Supabase auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    toast.error(error.message)
    return
  }

  // Auto-generate encryption key after successful signup (CLIENT-SIDE ONLY)
  if (data.user) {
    try {
      await initializeEncryptionForUser(data.user.id)
      toast.success('Account created! Your notes will be encrypted end-to-end.')
    } catch (encryptionError) {
      console.error('Failed to initialize encryption:', encryptionError)
      toast.warning('Account created, but encryption setup failed. Please enable it in settings.')
    }
  }

  // Redirect to app
  router.push('/journal')
}
```

### Database Migration

```sql
-- /supabase/migrations/20251101000000_add_encryption_fields.sql

-- Add encryption columns to notes table
ALTER TABLE notes
ADD COLUMN encryption_version INTEGER DEFAULT NULL,
ADD COLUMN encrypted_title TEXT DEFAULT NULL,
ADD COLUMN title_iv TEXT DEFAULT NULL,
ADD COLUMN encrypted_content TEXT DEFAULT NULL,
ADD COLUMN content_iv TEXT DEFAULT NULL;

-- Create index for performance
CREATE INDEX idx_notes_encryption_version
ON notes(user_id, encryption_version);

-- Add documentation
COMMENT ON COLUMN notes.encryption_version IS
  'NULL = plain text (legacy), 1 = AES-256-GCM';

COMMENT ON COLUMN notes.title_iv IS
  'Initialization vector for title encryption (base64)';

COMMENT ON COLUMN notes.content_iv IS
  'Initialization vector for content encryption (base64)';
```

### Updated Note Operations

```typescript
// /src/lib/notes/encrypted-operations.ts

export async function saveEncryptedNote(
  note: { id?: string; title: string; content: string; noteType: string },
  userId: string
): Promise<string> {
  // Get user's encryption key
  const key = await getUserEncryptionKey(userId)

  // Encrypt title and content separately (different IVs)
  const encryptedTitle = await encryptNote(note.title, key)
  const encryptedContent = await encryptNote(note.content, key)

  // Save to database
  const { data, error } = await supabase
    .from('notes')
    .upsert({
      id: note.id,
      user_id: userId,
      encrypted_title: encryptedTitle.ciphertext,
      title_iv: encryptedTitle.iv,
      encrypted_content: encryptedContent.ciphertext,
      content_iv: encryptedContent.iv,
      encryption_version: 1,
      note_type: note.noteType,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

export async function getDecryptedNote(
  noteId: string,
  userId: string
): Promise<Note> {
  // Fetch note
  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single()

  if (error) throw error

  // Handle legacy plain text notes
  if (!note.encryption_version) {
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      noteType: note.note_type,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    }
  }

  // Decrypt with separate IVs for title and content
  const key = await getUserEncryptionKey(userId)

  const title = await decryptNote(
    {
      ciphertext: note.encrypted_title,
      iv: note.title_iv,
      version: note.encryption_version,
    },
    key
  )

  const content = await decryptNote(
    {
      ciphertext: note.encrypted_content,
      iv: note.content_iv,
      version: note.encryption_version,
    },
    key
  )

  return {
    id: note.id,
    title,
    content,
    noteType: note.note_type,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  }
}
```

### Migration Script

```typescript
// /src/lib/notes/migration.ts

export async function migrateAllUserNotes(
  userId: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // Get user's encryption key
  const key = await getUserEncryptionKey(userId)

  // Get all plain text notes
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, title, content')
    .eq('user_id', userId)
    .is('encryption_version', null)

  if (error) throw error
  if (!notes || notes.length === 0) return

  // Store original values for rollback
  const originalNotes = notes.map(n => ({
    id: n.id,
    title: n.title,
    content: n.content
  }))

  try {
    // Migrate in batches (with rollback capability)
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]

      // Guard against null/undefined - coalesce to empty string
      const title = note.title ?? ''
      const content = note.content ?? ''

      // Encrypt both title and content
      const encryptedTitle = await encryptNote(title, key)
      const encryptedContent = await encryptNote(content, key)

      // Update database
      const { error: updateError } = await supabase
        .from('notes')
        .update({
          encrypted_title: encryptedTitle.ciphertext,
          title_iv: encryptedTitle.iv,
          encrypted_content: encryptedContent.ciphertext,
          content_iv: encryptedContent.iv,
          encryption_version: 1,
          title: null, // Clear plain text
          content: null,
        })
        .eq('id', note.id)

      if (updateError) {
        throw new Error(`Failed to encrypt note ${note.id}: ${updateError.message}`)
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, notes.length)
      }
    }
  } catch (error) {
    console.error('Migration failed, rolling back...', error)

    // Rollback: restore original plain text values
    for (const original of originalNotes) {
      await supabase
        .from('notes')
        .update({
          title: original.title,
          content: original.content,
          encrypted_title: null,
          title_iv: null,
          encrypted_content: null,
          content_iv: null,
          encryption_version: null,
        })
        .eq('id', original.id)
    }

    throw error // Re-throw to notify caller
  }
}
```

### UI Components

```tsx
// /src/components/settings/EnableEncryptionButton.tsx

export function EnableEncryptionButton() {
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 1 }) // Initialize total to 1 to avoid NaN

  const handleEnableEncryption = async () => {
    const confirmed = await showConfirmDialog({
      title: 'Enable End-to-End Encryption',
      message: 'This will encrypt all your notes. Only you will be able to read them. This action cannot be undone.',
      confirmText: 'Enable Encryption',
    })

    if (!confirmed) return

    setIsEncrypting(true)

    try {
      // Generate encryption key
      const key = await generateUserKey()
      await storeUserKey(currentUserId, key)

      // Migrate all notes
      await migrateAllUserNotes(currentUserId, (current, total) => {
        setProgress({ current, total })
      })

      toast.success('✅ All notes encrypted. Your privacy is now protected.')
    } catch (error) {
      console.error('Encryption failed:', error)
      toast.error('Failed to enable encryption. Please try again.')
    } finally {
      setIsEncrypting(false)
    }
  }

  // Calculate progress percentage safely (avoid NaN)
  const progressPercent = progress.total > 0
    ? (progress.current / progress.total) * 100
    : 0

  return (
    <div>
      <Button onClick={handleEnableEncryption} disabled={isEncrypting}>
        {isEncrypting ? 'Encrypting...' : 'Enable Encryption'}
      </Button>
      {isEncrypting && progress.total > 0 && (
        <Progress
          value={progressPercent}
          className="mt-2"
        />
      )}
    </div>
  )
}
```

```tsx
// /src/components/notes/EncryptedBadge.tsx

export function EncryptedBadge({ note }: { note: Note }) {
  if (!note.encryption_version) return null

  return (
    <Badge variant="secondary" className="gap-1">
      <LockIcon className="h-3 w-3" />
      Encrypted
    </Badge>
  )
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// /src/lib/crypto/__tests__/encryption.test.ts

describe('Encryption', () => {
  it('should encrypt and decrypt correctly', async () => {
    const key = await generateUserKey()
    const plaintext = 'My secret journal entry'

    const encrypted = await encryptNote(plaintext, key)
    const decrypted = await decryptNote(encrypted, key)

    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertexts for same plaintext', async () => {
    const key = await generateUserKey()
    const plaintext = 'Same text'

    const encrypted1 = await encryptNote(plaintext, key)
    const encrypted2 = await encryptNote(plaintext, key)

    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext)
    expect(encrypted1.iv).not.toBe(encrypted2.iv)
  })

  it('should fail to decrypt with wrong key', async () => {
    const key1 = await generateUserKey()
    const key2 = await generateUserKey()
    const plaintext = 'Secret'

    const encrypted = await encryptNote(plaintext, key1)

    await expect(decryptNote(encrypted, key2)).rejects.toThrow()
  })
})
```

### Integration Tests

```typescript
// /tests/e2e/encryption.spec.ts

test('should save and retrieve encrypted notes', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('[type="submit"]')

  // Enable encryption
  await page.goto('/settings/privacy')
  await page.click('text=Enable Encryption')
  await page.click('text=Confirm')
  await page.waitForSelector('text=All notes encrypted')

  // Create note
  await page.goto('/journal')
  await page.click('[aria-label="New entry"]')
  await page.fill('[contenteditable="true"]', 'This is my secret thought')
  await page.keyboard.press('Escape') // Auto-save

  // Verify encrypted in database
  const note = await supabase
    .from('notes')
    .select('encrypted_content, content, encryption_version')
    .single()

  expect(note.encryption_version).toBe(1)
  expect(note.encrypted_content).toBeTruthy()
  expect(note.encrypted_content).not.toContain('secret thought')
  expect(note.content).toBeNull()

  // Reload page and verify decryption
  await page.reload()
  await expect(page.locator('[contenteditable="true"]')).toContainText(
    'secret thought'
  )
})
```

---

## Success Metrics

### Privacy Metrics

- **Developer Access:** 0% - Developer cannot read encrypted notes in database
- **Encryption Coverage:** 100% of user notes encrypted within 1 week of rollout
- **Migration Success Rate:** >99% of notes successfully encrypted
- **Decryption Errors:** <0.1% of note reads fail due to decryption issues

### Performance Metrics

- **Encryption Time:** <5ms per note (p95)
- **Decryption Time:** <5ms per note (p95)
- **Batch Migration:** <2 seconds for 1000 notes
- **UI Responsiveness:** No perceivable lag when opening encrypted notes

### User Trust Metrics

- **Privacy Policy Views:** Track how many users read updated privacy policy
- **Encryption Adoption:** % of users who enable encryption within 30 days
- **User Feedback:** NPS score on privacy features
- **Support Tickets:** <5 encryption-related tickets per 1000 users

---

## Rollout Plan

### Week 1: Internal Testing
- Deploy to dev environment
- Test with internal team (5 users)
- Verify encryption works across devices
- Performance testing with 10,000 notes

### Week 2: Alpha Release
- Enable for alpha users (flag: `ENABLE_ENCRYPTION=alpha`)
- Email 50 alpha users with opt-in invitation
- Collect feedback on UX and performance
- Monitor error rates and support tickets

### Week 3: Beta Release
- Enable for all users (flag: `ENABLE_ENCRYPTION=true`)
- In-app banner: "New: End-to-End Encryption Available"
- Settings page shows prominent "Enable Encryption" button
- Monitor adoption rate and user feedback

### Week 4: Mandatory Migration (Optional)
- After 30 days, consider making encryption mandatory
- Users must enable encryption to continue using app
- Provide grace period for key generation
- Support team ready for recovery questions

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **Users lose device → data loss** | High | Medium | Phase 2: Add key recovery with password backup |
| **Decryption fails → notes unreadable** | Critical | Low | Extensive testing, rollback plan, support escalation |
| **Performance degradation** | Medium | Low | Optimize with Web Workers, caching, lazy decryption |
| **Browser compatibility issues** | Medium | Low | Test on Chrome, Safari, Firefox, Edge. Polyfill Web Crypto if needed |
| **Migration fails mid-way** | High | Low | Transactional migration, rollback capability, progress tracking |
| **Users confused by encryption UX** | Low | Medium | Clear onboarding, FAQs, in-app help, support docs |

---

## Open Questions

1. **Key Recovery:** Should Phase 1 include password-wrapped key backup, or defer to Phase 2?
   - **Recommendation:** Defer to Phase 2 to ship encryption faster. Document data loss risk in FAQ.

2. **Multi-Device Support:** How do users access notes on second device?
   - **Phase 1:** Second device cannot decrypt (key not synced). User must re-enable encryption.
   - **Phase 2:** Implement key sync via password-wrapped backup on server.

3. **Search Functionality:** Can users search encrypted notes?
   - **Phase 1:** Client-side search only (decrypt in memory, search locally).
   - **Future:** Research encrypted search indexes (complex, defer to later).

4. **Export Feature:** How to export encrypted notes for backup?
   - **Phase 1:** Export as encrypted JSON (can only be imported back into Signum).
   - **Phase 2:** Option to export decrypted plain text with user consent.

5. **Performance Target:** What's acceptable encryption latency?
   - **Proposed:** <50ms for single note, <2s for batch of 100 notes.

---

## Definition of Done

- [ ] All acceptance criteria met (AC1-AC14)
- [ ] Unit tests pass with >90% coverage
- [ ] Integration tests pass on Chrome, Safari, Firefox
- [ ] Performance benchmarks met (<5ms encrypt/decrypt)
- [ ] Code reviewed and approved
- [ ] Database migration tested on staging
- [ ] Privacy policy updated and reviewed by legal (if applicable)
- [ ] Documentation complete (README, technical design, FAQ)
- [ ] Alpha testing successful (0 P0 bugs)
- [ ] Deployed to production with feature flag
- [ ] Monitoring and alerts configured
- [ ] Support team trained on encryption features
- [ ] User communication prepared (email, in-app banner)

---

## Related Documents

- **Technical Design:** `/docs/technical-design/e2e-encryption-with-ai-analysis.md`
- **GitHub Issue:** [#110 - User Privacy & Security Audit](https://github.com/levineam/Signum/issues/110)
- **PRD Section:** Privacy & Security Requirements
- **Future Story:** Story 2.11 - AI Analysis with Consent (Phase 2)

---

## Estimated Effort

**Total:** 2-3 weeks (1 engineer)

- Week 1: Core encryption implementation (AC1-AC5) - 5 days
- Week 2: Migration & UI (AC6-AC9) - 5 days
- Week 3: Testing & polish (AC10-AC14) - 5 days

**Complexity:** Medium-High
- **Technical Complexity:** Medium (Web Crypto API well-documented)
- **Testing Complexity:** High (security-critical, must be bulletproof)
- **UX Complexity:** Low (transparent to users after opt-in)

---

## Notes

- This is Phase 1 of a two-phase encryption rollout
- AI features (ontology extraction) will be disabled until Phase 2
- Focus is on getting privacy protection live ASAP (2-3 weeks vs 6-7 weeks)
- Phase 2 will add AI analysis back with user consent and audit logging
- Key recovery and multi-device support deferred to Phase 2 to ship faster
- Success depends on thorough testing and clear user communication

---

**Story Author:** Claude Code (BMad Master Agent)
**Date Created:** 2025-10-30
**Last Updated:** 2025-10-30
