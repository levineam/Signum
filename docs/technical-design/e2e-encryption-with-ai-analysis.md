# End-to-End Encryption with AI Analysis
## Technical Design Document

**Status**: Draft
**Version**: 1.0
**Last Updated**: 2025-10-30
**Owner**: Engineering

---

## Executive Summary

This document describes the architecture for implementing end-to-end encryption (E2EE) for user notes in Signum while preserving AI-powered ontology extraction capabilities. The solution provides strong privacy guarantees by default while allowing users to opt-in to AI analysis on a per-note or bulk basis.

**Key Principle**: Notes are encrypted client-side and unreadable by the developer. Users explicitly consent to temporary decryption for AI processing.

---

## Goals & Requirements

### Privacy Goals

1. **Zero Default Access**: Developer cannot read user notes without explicit user action
2. **User Control**: Users decide which notes to analyze with AI
3. **Transparency**: Clear audit trail of what was analyzed and when
4. **No Plain Text Storage**: Server never persists decrypted note content
5. **Auditable**: Security architecture can be verified by third parties

### Functional Requirements

1. **Preserve AI Quality**: Continue using OpenAI GPT-5 for ontology extraction
2. **Seamless UX**: Encryption should be invisible for normal note-taking
3. **Backward Compatible**: Migrate existing plain text notes to encrypted format
4. **Performance**: Encryption/decryption must not noticeably impact app speed
5. **Key Recovery**: Users can recover access if they lose their device

---

## Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Browser                           │
│                                                                   │
│  1. User writes note                                             │
│  2. Encrypt with user key ──────────┐                           │
│  3. Send encrypted blob             │                           │
│     to server                        │                           │
│                                      ▼                           │
│  ┌──────────────────────────────────────────────┐              │
│  │  Encrypted Note Content (AES-256-GCM)        │              │
│  │  "U2FsdGVkX1+fZ3xQ..."                       │              │
│  └──────────────────────────────────────────────┘              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                      Supabase Database                         │
│                                                                 │
│  notes table:                                                   │
│  ├─ id: uuid                                                    │
│  ├─ user_id: uuid                                               │
│  ├─ title: text (encrypted)                                     │
│  ├─ content: text (encrypted blob)                              │
│  ├─ encryption_version: int                                     │
│  └─ ...                                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              AI Analysis Flow (User Initiated)                   │
│                                                                   │
│  1. User clicks "Analyze with AI"                               │
│  2. Show consent dialog                                          │
│  3. Decrypt note client-side ────────┐                          │
│  4. Send plain text to API           │                          │
│                                      ▼                          │
│  ┌──────────────────────────────────────────────┐              │
│  │  Plain Text (in memory only)                 │              │
│  │  "Today I reflected on..."                   │              │
│  └──────────────────────────────────────────────┘              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                    Next.js API Route                           │
│                                                                 │
│  /api/ontology-extract                                          │
│  ├─ Verify user authentication                                  │
│  ├─ Log analysis request (audit trail)                          │
│  ├─ Forward to OpenAI API (ephemeral)                           │
│  └─ Return results immediately                                  │
│     (plain text NOT stored)                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────┐
│                       OpenAI API                               │
│                                                                 │
│  ├─ Receive plain text                                          │
│  ├─ Extract ontology (values, beliefs, aims)                    │
│  ├─ Return structured results                                   │
│  └─ Data retained 30 days per OpenAI policy                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Technical Design

### 1. Encryption Layer

#### Key Generation

**On User Signup:**
```typescript
// /src/lib/crypto/keyManagement.ts

import { generateKey, exportKey, importKey } from './encryption'

export async function initializeUserEncryption(userId: string) {
  // Generate 256-bit AES-GCM key
  const encryptionKey = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )

  // Export as JWK for storage
  const jwk = await crypto.subtle.exportKey('jwk', encryptionKey)

  // Store in browser (IndexedDB for persistence)
  await storeUserKey(userId, jwk)

  // Optional: Encrypt key with password for recovery
  const wrappedKey = await wrapKeyWithPassword(jwk, userPassword)

  // Store wrapped key on server for recovery
  await saveWrappedKeyToServer(userId, wrappedKey)

  return encryptionKey
}
```

#### Key Storage Options

**Option A: IndexedDB Only** (Simplest)
- Store unwrapped key in browser's IndexedDB
- Fast access, no password needed for daily use
- Lost if user clears browser data

**Option B: Password-Wrapped Key** (Recommended)
- Store password-wrapped key on server
- User enters password to unwrap on new device
- Recovery possible if device lost

**Option C: Supabase Auth Integration**
- Derive encryption key from Supabase session token
- Automatic key derivation on login
- Simpler UX, but key tied to auth provider

**Recommendation**: Start with **Option B** for balance of security and UX.

#### Encryption Functions

```typescript
// /src/lib/crypto/encryption.ts

export interface EncryptedData {
  ciphertext: string // Base64-encoded
  iv: string // Base64-encoded initialization vector
  version: number // Encryption version for future migrations
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

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  )

  // Return as base64 strings for storage
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
  // Convert base64 back to ArrayBuffer
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext)
  const iv = base64ToArrayBuffer(encrypted.iv)

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  )

  // Convert bytes back to string
  const decoder = new TextDecoder()
  return decoder.decode(plaintext)
}

// Utility functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  return btoa(String.fromCharCode(...bytes))
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
```

---

### 2. Database Schema Changes

#### Migration: Add Encryption Fields

```sql
-- /supabase/migrations/20251101000000_add_encryption_fields.sql

-- Add encryption metadata columns
ALTER TABLE notes
ADD COLUMN encryption_version INTEGER DEFAULT NULL,
ADD COLUMN encrypted_title TEXT DEFAULT NULL,
ADD COLUMN title_iv TEXT DEFAULT NULL, -- IV for title encryption
ADD COLUMN encrypted_content TEXT DEFAULT NULL,
ADD COLUMN content_iv TEXT DEFAULT NULL; -- IV for content encryption

-- Create index for encrypted notes query
CREATE INDEX idx_notes_encryption_version ON notes(user_id, encryption_version);

-- Comment for documentation
COMMENT ON COLUMN notes.encryption_version IS
  'NULL = plain text (legacy), 1 = AES-256-GCM, future versions for algorithm updates';

COMMENT ON COLUMN notes.title_iv IS
  'Initialization vector for title encryption (base64-encoded)';

COMMENT ON COLUMN notes.content_iv IS
  'Initialization vector for content encryption (base64-encoded)';

-- New table: User encryption metadata
CREATE TABLE user_encryption_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wrapped_key TEXT NOT NULL, -- Password-encrypted encryption key
  key_derivation_method TEXT NOT NULL DEFAULT 'pbkdf2', -- 'pbkdf2', 'argon2', etc.
  salt TEXT NOT NULL, -- Salt for key derivation
  iterations INTEGER NOT NULL DEFAULT 100000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE user_encryption_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own wrapped key"
  ON user_encryption_keys
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own wrapped key"
  ON user_encryption_keys
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own wrapped key"
  ON user_encryption_keys
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Audit table for AI analysis requests
CREATE TABLE ai_analysis_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'ontology-extraction',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_ai_analysis_audit_user ON ai_analysis_audit(user_id, requested_at DESC);

-- RLS for audit log
ALTER TABLE ai_analysis_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own audit log"
  ON ai_analysis_audit
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own audit log entries"
  ON ai_analysis_audit
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

#### Backward Compatibility Strategy

```typescript
// /src/lib/notes/migration.ts

export async function migrateNoteToEncrypted(
  noteId: string,
  plainTextTitle: string,
  plainTextContent: string,
  encryptionKey: CryptoKey
): Promise<void> {
  // Encrypt both title and content with separate IVs
  const encryptedTitle = await encryptNote(plainTextTitle, encryptionKey)
  const encryptedContent = await encryptNote(plainTextContent, encryptionKey)

  // Update database
  await supabase
    .from('notes')
    .update({
      encrypted_title: encryptedTitle.ciphertext,
      title_iv: encryptedTitle.iv,
      encrypted_content: encryptedContent.ciphertext,
      content_iv: encryptedContent.iv,
      encryption_version: 1,
      title: null, // Clear plain text title
      content: null, // Clear plain text content
    })
    .eq('id', noteId)
}

export async function migrateAllUserNotes(userId: string): Promise<void> {
  // Get user's encryption key
  const key = await getUserEncryptionKey(userId)

  // Get all plain text notes (include both title and content)
  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, content')
    .eq('user_id', userId)
    .is('encryption_version', null)

  if (!notes) return

  // Migrate in batches
  for (const note of notes) {
    await migrateNoteToEncrypted(note.id, note.title, note.content, key)
  }
}
```

---

### 3. Client-Side Note CRUD

#### Save Note (Encrypted)

```typescript
// /src/lib/notes/encrypted-operations.ts

export async function saveEncryptedNote(
  note: {
    id?: string
    title: string
    content: string
    noteType: string
  },
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
```

#### Read Note (Decrypt)

```typescript
export async function getDecryptedNote(noteId: string, userId: string): Promise<Note> {
  // Fetch encrypted note
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
  const title = await decryptNote({
    ciphertext: note.encrypted_title,
    iv: note.title_iv,
    version: note.encryption_version,
  }, key)

  const content = await decryptNote({
    ciphertext: note.encrypted_content,
    iv: note.content_iv,
    version: note.encryption_version,
  }, key)

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

---

### 4. AI Analysis Consent Flow

#### UI Component: Consent Dialog

```typescript
// /src/components/ai/AIAnalysisConsentDialog.tsx

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface AIAnalysisConsentDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  noteCount: number
}

export function AIAnalysisConsentDialog({
  open,
  onConfirm,
  onCancel,
  noteCount,
}: AIAnalysisConsentDialogProps) {
  const [rememberChoice, setRememberChoice] = useState(false)

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>🔓 AI Analysis Permission</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              To analyze {noteCount === 1 ? 'this note' : `${noteCount} notes`} with AI,
              your encrypted content will be temporarily decrypted and sent to OpenAI's API.
            </p>

            <div className="bg-muted p-3 rounded-md text-sm space-y-2">
              <p className="font-medium">What happens:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Notes decrypted in your browser</li>
                <li>Plain text sent to Signum servers</li>
                <li>Forwarded to OpenAI for ontology extraction</li>
                <li>Plain text is NOT stored on our servers</li>
                <li>OpenAI retains data for 30 days per their policy</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              This request will be logged in your{' '}
              <a href="/settings/privacy" className="underline">
                privacy audit log
              </a>
              .
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="remember"
                checked={rememberChoice}
                onCheckedChange={(checked) => setRememberChoice(checked as boolean)}
              />
              <label htmlFor="remember" className="text-sm cursor-pointer">
                Remember my choice for future analyses
              </label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => {
            if (rememberChoice) {
              localStorage.setItem('ai-analysis-consent', 'granted')
            }
            onConfirm()
          }}>
            Analyze with AI
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

#### Analysis Trigger

```typescript
// /src/lib/ai/analyzeWithConsent.ts

export async function analyzeNoteWithAI(noteId: string): Promise<OntologyResult> {
  // Check for stored consent preference
  const hasConsent = localStorage.getItem('ai-analysis-consent') === 'granted'

  if (!hasConsent) {
    // Show consent dialog (returns promise)
    const userConsented = await showConsentDialog({ noteCount: 1 })
    if (!userConsented) {
      throw new Error('User declined AI analysis')
    }
  }

  // Get user's encryption key
  const key = await getUserEncryptionKey()

  // Fetch and decrypt note
  const note = await getDecryptedNote(noteId, getCurrentUserId())

  // Send plain text to API
  const response = await fetch('/api/ontology-extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      noteId: noteId,
      content: note.content, // Plain text
      title: note.title,
    }),
  })

  if (!response.ok) {
    throw new Error('AI analysis failed')
  }

  return response.json()
}
```

---

### 5. Server-Side API Route

#### Ontology Extraction Endpoint

```typescript
// /src/app/api/ontology-extract/route.ts

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: cookieStore }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request
    const { noteId, content, title } = await req.json()

    // 3. Validate that user owns this note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('user_id')
      .eq('id', noteId)
      .single()

    if (noteError || note.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Note not found or unauthorized' },
        { status: 403 }
      )
    }

    // 4. Log analysis request (AUDIT TRAIL)
    await supabase.from('ai_analysis_audit').insert({
      user_id: user.id,
      note_id: noteId,
      analysis_type: 'ontology-extraction',
      requested_at: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      user_agent: req.headers.get('user-agent'),
    })

    // 5. Call OpenAI API (plain text in memory only)
    const prompt = buildOntologyExtractionPrompt(title, content)

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at extracting personal values, beliefs, and aims from journal entries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    // 6. Return results immediately
    // IMPORTANT: Plain text is NOT stored anywhere
    return NextResponse.json({
      success: true,
      ontology: result,
      noteId,
    })

  } catch (error) {
    console.error('Ontology extraction error:', error)
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}

function buildOntologyExtractionPrompt(title: string, content: string): string {
  return `
Analyze the following journal entry and extract:
1. Values: Core principles the person holds important
2. Beliefs: Convictions about themselves, others, or the world
3. Aims: Goals, aspirations, or desired outcomes

Title: ${title}

Content:
${content}

Return as JSON:
{
  "values": ["value1", "value2", ...],
  "beliefs": ["belief1", "belief2", ...],
  "aims": ["aim1", "aim2", ...]
}
`
}
```

---

### 6. Privacy Audit Dashboard

#### User-Facing Transparency

```typescript
// /src/app/settings/privacy/page.tsx

export default function PrivacySettingsPage() {
  const [auditLog, setAuditLog] = useState<AIAnalysisAudit[]>([])

  useEffect(() => {
    async function fetchAuditLog() {
      const { data } = await supabase
        .from('ai_analysis_audit')
        .select(`
          *,
          notes(title, note_type)
        `)
        .order('requested_at', { ascending: false })
        .limit(100)

      setAuditLog(data || [])
    }

    fetchAuditLog()
  }, [])

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy & Security</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Encryption Status</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-medium text-green-900">
                End-to-End Encryption Enabled
              </p>
              <p className="text-sm text-green-700">
                Your notes are encrypted with AES-256-GCM. Only you can read them.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">AI Analysis History</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Every time you use AI analysis, it's logged here. Plain text notes are sent to OpenAI only during analysis and are not stored on our servers.
        </p>

        {auditLog.length === 0 ? (
          <p className="text-muted-foreground">No AI analyses performed yet.</p>
        ) : (
          <div className="border rounded-lg divide-y">
            {auditLog.map((entry) => (
              <div key={entry.id} className="p-4 hover:bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{entry.notes.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.analysis_type}
                    </p>
                  </div>
                  <time className="text-sm text-muted-foreground">
                    {new Date(entry.requested_at).toLocaleString()}
                  </time>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">AI Analysis Consent</h2>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">Remember my AI analysis consent</p>
            <p className="text-sm text-muted-foreground">
              Skip the confirmation dialog for future analyses
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem('ai-analysis-consent')
              toast.success('Consent preference cleared')
            }}
          >
            Reset
          </Button>
        </div>
      </section>
    </div>
  )
}
```

---

## Implementation Roadmap

### 🚀 FAST TRACK: Encryption-Only Release (Recommended)

**Goal**: Get encryption live ASAP so users know their notes are private, add AI features later.

**Timeline**: 2-3 weeks

#### Phase 1A: Core Encryption (Week 1)

- [ ] Implement encryption utilities (`encryption.ts`, `keyManagement.ts`)
- [ ] Add database schema migrations (encryption columns only)
- [ ] Update note CRUD operations to use encryption
- [ ] Test encryption/decryption performance
- [ ] Write unit tests for crypto functions

#### Phase 1B: Migration & UI (Week 2)

- [ ] Implement migration script for existing plain text notes
- [ ] Add "🔒 Encrypted" indicator in UI
- [ ] Build simple privacy settings page showing encryption status
- [ ] Add feature flag for gradual rollout
- [ ] Test with real production data (staging environment)

#### Phase 1C: Polish & Launch (Week 3)

- [ ] End-to-end testing of encryption flow
- [ ] Performance testing (encrypt/decrypt 1000 notes)
- [ ] Update privacy policy: "Your notes are encrypted end-to-end"
- [ ] Deploy to production
- [ ] Monitor for issues

**At this point**: ✅ Users can trust their notes are private. Developer cannot read them.

---

### Phase 2: AI Analysis Features (Later - 3-4 weeks)

**Add AI features once encryption is stable.**

#### Phase 2A: Consent Flow (Week 4-5)

- [ ] Build consent dialog UI component
- [ ] Implement consent state management
- [ ] Add "Analyze with AI" button to UI
- [ ] Test user flows (accept, decline, remember choice)

#### Phase 2B: API Integration (Week 5-6)

- [ ] Create audit logging table and policies
- [ ] Update `/api/ontology-extract` to accept plain text
- [ ] Implement client-side decryption before API call
- [ ] Test OpenAI integration with gpt-5-mini
- [ ] Add AI analysis history to privacy dashboard

#### Phase 2C: Testing & Launch (Week 6-7)

- [ ] End-to-end testing of AI analysis flow
- [ ] Security review of consent flow
- [ ] Update privacy policy with OpenAI disclosure
- [ ] Gradual rollout of AI features

---

### Phase 3: Advanced Features (Future)

#### Key Recovery (Optional)

- [ ] Implement password-wrapped key backup
- [ ] Build key recovery flow for new devices
- [ ] Test account recovery scenarios
- [ ] Document recovery process for support

#### GDPR Compliance (Required before EU launch)

- [ ] Add data export feature
- [ ] Add data deletion feature
- [ ] Create privacy audit log
- [ ] Compliance documentation

---

## Why Split Into Two Phases?

### Benefits of Encryption-First Approach

1. **Faster Time to Privacy**: Users get privacy guarantees in 2-3 weeks instead of 6-7 weeks
2. **Reduced Risk**: Encryption is simpler to implement and test than AI integration
3. **User Trust**: Shows commitment to privacy before adding controversial AI features
4. **Easier Rollback**: If issues arise, only encryption needs to be fixed (not AI integration)
5. **Iterative Development**: Can gather user feedback on encryption UX before adding AI

### Phase 1 (Encryption-Only) User Experience

**What users can do:**
- ✅ Write notes (automatically encrypted)
- ✅ Read their own notes (automatically decrypted)
- ✅ See "🔒 Encrypted" indicator
- ✅ Trust that developer cannot read their notes

**What users cannot do yet:**
- ❌ AI ontology extraction (coming in Phase 2)
- ❌ View AI analysis history
- ❌ Bulk analyze notes

**UI Message**: "Your notes are now encrypted end-to-end. AI analysis features coming soon!"

### Technical Differences Between Phases

| Feature | Phase 1 (Encryption) | Phase 2 (AI) |
|---------|---------------------|--------------|
| Encryption | ✅ Enabled | ✅ Enabled |
| Decryption | ✅ Automatic | ✅ Automatic + On-demand for AI |
| AI Analysis | ❌ Disabled | ✅ With consent |
| Consent Dialog | ❌ Not needed | ✅ Required |
| Audit Logging | ❌ Optional | ✅ Required |
| OpenAI Integration | ❌ Not used | ✅ Active |

---

## Minimal Phase 1 Implementation

### What's Included

1. **Encryption Layer** (`/src/lib/crypto/`)
   - `encryption.ts` - AES-256-GCM functions
   - `keyManagement.ts` - Key generation and storage

2. **Database Schema** (simplified for Phase 1)
   ```sql
   ALTER TABLE notes
   ADD COLUMN encryption_version INTEGER DEFAULT NULL,
   ADD COLUMN encrypted_title TEXT DEFAULT NULL,
   ADD COLUMN title_iv TEXT DEFAULT NULL,
   ADD COLUMN encrypted_content TEXT DEFAULT NULL,
   ADD COLUMN content_iv TEXT DEFAULT NULL;
   ```

3. **Updated Note Operations**
   - `saveEncryptedNote()` - Encrypt before saving
   - `getDecryptedNote()` - Decrypt after fetching
   - Migration script for existing notes

4. **Simple UI Indicator**
   ```tsx
   {note.encryption_version && (
     <Badge variant="secondary" className="gap-1">
       <LockIcon className="h-3 w-3" />
       Encrypted
     </Badge>
   )}
   ```

### What's NOT Included (Phase 2)

- ❌ Consent dialog component
- ❌ AI analysis button
- ❌ `/api/ontology-extract` route modifications
- ❌ Audit logging table
- ❌ Privacy dashboard with AI history
- ❌ OpenAI integration

### Phase 1 Privacy Policy Update

**Before**:
> "Your notes are stored securely in our database."

**After Phase 1**:
> "Your notes are encrypted end-to-end using AES-256-GCM encryption. Only you hold the decryption key. We cannot read your notes. AI analysis features are currently disabled while we ensure your privacy is protected."

**After Phase 2**:
> "Your notes are encrypted end-to-end. When you choose to use AI analysis, you'll be asked for explicit consent to temporarily decrypt specific notes for processing."

---

## Recommended Next Steps

1. **Approve Fast Track**: Agree to split into encryption-first (Phase 1) and AI-later (Phase 2)
2. **Start Phase 1 Implementation**: I can begin building the encryption layer now
3. **Timeline Decision**: Aim for 2-3 week Phase 1 deployment?
4. **Feature Flag**: Enable encryption for alpha users first, then broader rollout?

This approach gets you to "developer cannot read notes" in weeks instead of months, while preserving the full AI vision for later.

---

## Security Considerations

### Threats & Mitigations

| Threat | Mitigation |
|--------|-----------|
| **Developer reads database** | Notes encrypted, unreadable without user's key |
| **Server-side logging of plain text** | Code review, audit logging, no plain text persistence |
| **Key theft from browser** | IndexedDB is origin-isolated, HTTPS required |
| **Man-in-the-middle attack** | TLS/HTTPS for all connections, certificate pinning |
| **OpenAI data retention** | Disclosed in consent dialog, users can opt-out |
| **Database backup restoration** | Encrypted data remains encrypted in backups |
| **Malicious code injection** | CSP headers, SRI for scripts, code signing |

### Audit & Compliance

1. **Regular Security Audits**: Quarterly third-party penetration testing
2. **Code Reviews**: All crypto code reviewed by security engineer
3. **Incident Response**: Plan for handling key compromise or data breach
4. **Transparency Reports**: Publish annual report on AI analysis usage
5. **GDPR Compliance**: Right to export, right to be forgotten, data processing agreements

---

## Performance Considerations

### Encryption Overhead

- **AES-256-GCM**: ~1-2ms per note on modern hardware
- **Batch operations**: Encrypt/decrypt in parallel with Web Workers
- **Caching**: Keep decrypted notes in memory during session

### Database Impact

- **Storage increase**: ~33% (base64 encoding overhead)
- **Query performance**: No impact on indexed fields
- **Migration time**: ~1 second per 1000 notes

### Optimization Strategies

1. **Lazy decryption**: Only decrypt visible notes
2. **Virtual scrolling**: Render encrypted placeholders, decrypt on-demand
3. **Web Workers**: Offload crypto operations from main thread
4. **Progressive migration**: Encrypt new notes first, legacy notes over time

---

## User Experience

### Onboarding Flow

1. **First login**: Prompt to enable encryption
2. **Key generation**: "Setting up secure encryption..."
3. **Migration**: "Encrypting your existing notes... (45/100)"
4. **Completion**: "✅ Your notes are now encrypted"

### Daily Usage

- **Invisible encryption**: Users shouldn't notice any difference
- **Performance**: No perceivable lag when opening notes
- **Sync**: Works seamlessly across devices (key synced via wrapped backup)

### AI Analysis UX

1. User clicks "Analyze Ontology" button
2. Consent dialog appears (first time only, unless reset)
3. Loading state: "Analyzing with AI..."
4. Results appear: "Found 3 values, 5 beliefs, 2 aims"
5. Audit log updated automatically

---

## Testing Strategy

### Unit Tests

```typescript
// /src/lib/crypto/__tests__/encryption.test.ts

describe('Encryption', () => {
  it('should encrypt and decrypt text correctly', async () => {
    const key = await generateKey()
    const plaintext = 'My secret journal entry'

    const encrypted = await encryptNote(plaintext, key)
    const decrypted = await decryptNote(encrypted, key)

    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertexts for same plaintext', async () => {
    const key = await generateKey()
    const plaintext = 'Same text'

    const encrypted1 = await encryptNote(plaintext, key)
    const encrypted2 = await encryptNote(plaintext, key)

    expect(encrypted1.ciphertext).not.toBe(encrypted2.ciphertext)
    expect(encrypted1.iv).not.toBe(encrypted2.iv)
  })

  it('should fail to decrypt with wrong key', async () => {
    const key1 = await generateKey()
    const key2 = await generateKey()
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

  // Create note
  await page.goto('/journal')
  await page.click('[aria-label="New entry"]')
  await page.fill('[contenteditable="true"]', 'This is my secret thought')
  await page.keyboard.press('Escape') // Auto-save

  // Verify encrypted in database
  const note = await supabase
    .from('notes')
    .select('encrypted_content, content')
    .single()

  expect(note.encrypted_content).toBeTruthy()
  expect(note.encrypted_content).not.toContain('secret thought')
  expect(note.content).toBeNull()

  // Reload page and verify decryption
  await page.reload()
  await expect(page.locator('[contenteditable="true"]')).toContainText('secret thought')
})
```

### Security Tests

```typescript
test('should not expose plain text in API logs', async ({ page }) => {
  // Enable network logging
  const requests: string[] = []
  page.on('request', (req) => requests.push(req.url()))

  // Create note with sensitive content
  await page.goto('/journal')
  await page.fill('[contenteditable="true"]', 'My SSN is 123-45-6789')
  await page.keyboard.press('Escape')

  // Verify no request body contains plain text SSN
  for (const url of requests) {
    const response = await fetch(url)
    const body = await response.text()
    expect(body).not.toContain('123-45-6789')
  }
})
```

---

## Rollback Plan

### If Encryption Causes Issues

1. **Feature flag**: Disable encryption for new notes
2. **Legacy mode**: Keep reading encrypted notes, write plain text
3. **Selective rollback**: Decrypt specific users' notes if they report issues
4. **Full rollback**: Decrypt all notes back to plain text (last resort)

### Monitoring

- **Error tracking**: Sentry alerts for decryption failures
- **Performance monitoring**: Track encryption time (p50, p95, p99)
- **User feedback**: Collect bug reports and UX friction
- **Audit logs**: Monitor for unusual access patterns

---

## Open Questions

1. **Key recovery**: Should we support email-based key reset? (Risk: weakens security)
2. **Search**: How to implement full-text search on encrypted notes? (Options: client-side search, encrypted search indexes)
3. **Sharing**: If users want to share notes, how to handle encryption? (Options: decrypt + re-encrypt with recipient's key, or share plain text with consent)
4. **AI model updates**: When OpenAI releases GPT-6, can we re-analyze encrypted notes without user re-consenting? (Decision: Require new consent for major model updates)
5. **Performance targets**: What's acceptable encryption latency? (Proposal: <50ms for single note, <2s for batch of 100)

---

## References

- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [OpenAI Data Usage Policy](https://openai.com/policies/api-data-usage-policies)
- [GDPR Article 25: Data Protection by Design](https://gdpr-info.eu/art-25-gdpr/)

---

## Approval

- [ ] Engineering Lead
- [ ] Security Engineer
- [ ] Product Manager
- [ ] Legal/Compliance

**Last Updated**: 2025-10-30
