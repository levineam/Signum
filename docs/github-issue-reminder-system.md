# GitHub Issue: Intent-Driven Reminder System - The Meaning Loop

**Issue Title**: Feature: Intent-Driven Reminder System - The Meaning Loop

**Labels**: `enhancement`, `feature`, `ai-powered`, `integrations`, `high-priority`

**Milestone**: Story 2.5 - Reminder System

---

## 🎯 Mission

Every feature should tighten the loop between what matters to a person and what they actually do. Reminders aren't just nagware—they're the smallest actionable unit of meaning.

## The Meaning Loop (Product North Star)

1. **Capture**: User writes naturally ("I hope I remember on April 1 to post a silly tweet")
2. **Clarify**: App distills intention → "Post silly tweet"
3. **Commit**: Schedule it (time/recurrence/context)
4. **Calendarize**: Sync to user's existing system (Apple Reminders, Google Tasks, etc.)
5. **Check-in**: Nudge + completion
6. **Reflect**: Quick after-action note ("did it / didn't / why"), feeding back into the journal

**Friction test**: If a feature doesn't strengthen this loop, don't ship it.

---

## 🎬 Demo Flow: "Type it once, live it everywhere"

**Goal**: Show zero extra friction to turn meaning into action.

### User Journey
1. Brand-new user lands, signs up, starts typing
2. Writes: _"I hope I remember to post a funny, silly tweet on April 1"_
3. Inline chip appears: `Reminder created • Apr 1, 9:00 · Edit · Undo`
4. Toast notification: _"Also added to Apple Reminders"_
5. Tap chip → see:
   - The reminder inside Signum
   - Link that jumps to the item in Apple Reminders

**Why this sells the mission**: Zero friction, upgrades tools they already use.

---

## 🏗️ Architecture: One Contract, Many Connectors

Don't build infinite integrations. Build a stable contract that developers can extend.

### Core Types

```typescript
type ISODate = string; // 2025-04-01T09:00:00-04:00

export interface Intent {
  kind: 'reminder' | 'goal' | 'reflection';
  text: string;               // raw sentence
  spans?: [number, number][]; // offsets in the note
  certainty: number;          // 0..1
}

export interface Reminder {
  id: string;
  title: string;              // "Post silly tweet"
  description?: string;       // link-back + context
  noteAnchor: { noteId: string; offset: number };
  due?: ISODate;
  allDay?: boolean;
  recurrence?: string;        // RFC 5545 RRULE
  location?: {
    name: string;
    lat?: number;
    lon?: number;
    radiusM?: number;
  };
  status: 'open' | 'done' | 'cancelled';
  providerLinks: Record<string, { id: string; url?: string }>;
  source: 'note-auto' | 'manual' | 'import';
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ConnectorCapabilities {
  timeAlarm: boolean;
  locationAlarm: boolean;
  recurrence: 'none' | 'basic' | 'rrule';
  deepLink: boolean;
}

export interface ReminderConnector {
  id: string; // e.g., 'apple-reminders', 'google-tasks'
  capabilities: ConnectorCapabilities;
  connect(): Promise<void>;      // OAuth / device permission
  upsert(reminder: Reminder): Promise<{ remoteId: string; url?: string }>;
  complete(remoteId: string): Promise<void>;
  delete(remoteId: string): Promise<void>;
  health(): Promise<'ok' | 'degraded' | 'error'>;
}
```

### Key Architecture Principle

**Meaning Engine** (intent extraction + defaults) → **Task Outbox** (idempotent, retriable, auditable) → **Connectors** (provider-specific)

---

## 🔌 Integration Strategy

### Phase 0: Apple Shortcuts Bridge (No app install, easy demo)

- Provide one-tap "Install Shortcut"
- Web app invokes: `shortcuts://run-shortcut?name=Add Signum Reminder&input=<JSON>`
- Shortcut creates Reminders item using "Add New Reminder" action
- First run: user taps "Allow", subsequent runs automatic
- Perfect for demo and MVP

### Phase 1: Thin iOS Helper (Best UX)

- Tiny native app using EventKit
- Receives universal link/App Clip payload
- Writes to Reminders via `EKReminder` + `EKAlarm`
- Uses same JSON payload as Shortcut

### Cross-Platform (Cloud-Friendly)

- **Google Tasks**: OAuth; `tasks.tasks.insert`
- **Microsoft To Do**: Graph `/me/todo/lists/{id}/tasks`
- **Universal Fallback**: Read-only .ics feed

---

## 📦 Repository Structure

```
/apps/web              # Next.js app
/packages/meaning      # Meaning Engine (intent extraction)
/packages/schema       # Zod/JSON-Schema for Intent/Reminder
/packages/outbox       # Durable job queue + idempotency
/packages/connectors   # Connector registry + helpers
  /apple-shortcut      # URL builder + docs
  /google-tasks        # OAuth + upsert
  /ms-todo             # OAuth + upsert
/examples/demo         # April 1 "silly tweet" demo script
/docs/reminders        # Mission, Meaning Loop, RFC template
```

---

## 🎨 UX Principles

### Inline, Not Modal
- Inline chips: `Created reminder • Apr 1, 9:00 · Edit · Undo`
- Right-rail "Reminders in this note" card (Today / Upcoming)
- Global "Today" view with 15-second check-in

### Link-Back to Context
- External reminders deep-link to exact sentence in note
- Completion creates reflection moment

### Smart Defaults, Always Editable
- "next month" → first business day at 9 a.m.
- Timezone-aware
- 10-second undo buffer
- Edit dialog for title/time/recurrence

---

## 🛡️ Guardrails (Mission Before Mechanics)

- ✅ **Friction test**: Does this reduce effort to act on what matters?
- ✅ **Reflection hook**: Does completion create a moment to learn?
- ✅ **Autonomy**: Smart defaults, explicit consent
- ✅ **Privacy**: Title, time, note link only; full text never leaves without opt-in
- ✅ **Portability**: Everything exportable as JSON + ICS

---

## 🚀 Minimal Spec for Launch Demo

### Core Features
1. Intent extractor catches temporal phrases
2. Defaults: 9:00 a.m. local, timezone-aware
3. Inline chip appears with 10s undo buffer
4. Edit dialog for title/time adjustment
5. Outbox posts to Apple Shortcut OR Google Tasks
6. Success toast with "View in Reminders" link
7. "Connected Reminders" settings page

### Success Criteria
- User types natural language reminder
- Reminder appears in both Signum AND external system
- Can complete in external system, reflects in Signum
- Link-back from external reminder to note works

---

## 👥 Contribution Guidelines

### RFC Template for Contributors
1. **Problem** & link to Meaning Loop step
2. **API changes** (schemas)
3. **UX surfaces** (chips, toasts, settings)
4. **Privacy model** (what leaves device)
5. **Test plan** (unit + integration + demo)

### Good First Issues
- [ ] Add recurrence editor UI that emits RRULE
- [ ] Add "approximate date" handling ("next month" logic)
- [ ] Add Google Tasks connector with deep link
- [ ] Ship Apple Shortcut installer page
- [ ] Build timezone detection + default time logic
- [ ] Create "Today" view with check-in UI

---

## 📋 Implementation Checklist

### Story 1: Intent Detection (Foundation)
- [ ] Define TypeScript schemas (`Intent`, `Reminder`)
- [ ] Build Meaning Engine for temporal extraction
- [ ] Add inline chip UI component
- [ ] Implement 10-second undo buffer
- [ ] Create reminder storage (Supabase table + RLS)

### Story 2: Apple Shortcuts Integration (MVP)
- [ ] Design Shortcut JSON payload
- [ ] Build Apple Shortcut installer page
- [ ] Implement `shortcuts://` URL generation
- [ ] Add "Connect Apple Reminders" flow
- [ ] Test end-to-end on iOS Safari

### Story 3: Task Outbox (Reliability)
- [ ] Build idempotent job queue
- [ ] Add retry logic with exponential backoff
- [ ] Implement sync status tracking
- [ ] Create health check system

### Story 4: Google Tasks Connector
- [ ] Implement OAuth flow
- [ ] Build `GoogleTasksConnector` class
- [ ] Add deep linking back to notes
- [ ] Test with Google Calendar integration

### Story 5: Reflection Loop
- [ ] Add completion webhook from providers
- [ ] Build check-in UI ("Done / Snooze / Why?")
- [ ] Link completions back to journal entries
- [ ] Generate reflection prompts

---

## 🎯 Success Metrics

- **Activation**: % of users who create first reminder
- **Retention**: % who complete reminders via external system
- **Reflection**: % who add notes after completion
- **Connection**: % who connect external provider
- **Accuracy**: Intent extraction precision/recall

---

## 📚 Additional Resources

- [RFC 5545 (RRULE)](https://tools.ietf.org/html/rfc5545)
- [Apple Shortcuts Documentation](https://support.apple.com/guide/shortcuts/welcome/ios)
- [Google Tasks API](https://developers.google.com/tasks)
- [Microsoft To Do Graph API](https://learn.microsoft.com/en-us/graph/api/resources/todo-overview)

---

## 🔄 Next Steps

1. Review and refine this design with the team
2. Create child issues for each Story (1-5)
3. Set up `/packages/` monorepo structure
4. Draft Apple Shortcut JSON schema
5. Build demo script for "April 1 silly tweet" flow

---

**Created**: 2025-10-21
**Status**: Design/Planning
**Owner**: TBD
