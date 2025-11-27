# Story 2.4.8: Execution Stack Sample Seeding (Empty State)

**Epic:** 2 - AI-Powered Personal Ontology  
**Status:** Draft  
**Created:** 2025-11-25  
**Related Issue:** TBD

## Story

**As a** new or demo user,  
**I want** the Execution Stack to show example projects and tasks when it’s empty,  
**so that** I immediately understand how goals, projects, and tasks relate without starting from a blank page.

## Acceptance Criteria

1) **Seed only when empty**: If all execution items are empty (no projects, no tasks), auto-seed sample projects/tasks on first load; otherwise do nothing.  
2) **One-time seeding**: After any user edit (add/delete/reassign), never reseed automatically.  
3) **Scoped to user**: Seeds are normal user-owned items—fully editable/deletable, no special flags, no cross-user leakage.  
4) **Reasonable defaults**: Provide 1–2 sample projects per existing goal, each with 1–2 tasks; leave unassigned column empty unless explicitly used.  
5) **Visibility & counts**: Column counts reflect seeded items; unassigned remains at 0 unless user moves items.  
6) **Removability**: Deleting seeded items follows existing delete flows (unassign/cascade/reassign). No surprises on reload.  
7) **Test coverage**: Add test to verify seeding when empty, non-seeding when data exists, and no reseed after deletion.

## Tasks / Subtasks

- [ ] Detect empty Execution Stack (no projects/tasks) and trigger one-time seeding per user.  
- [ ] Generate seed items per goal (1–2 projects; each 1–2 tasks) with UUID/order set and parent links.  
- [ ] Persist via existing notes metadata (goals/projects/tasks notes) using canonical fields.  
- [ ] Guard to avoid reseeding after any user change; honor delete/reassign flows.  
- [ ] Tests: empty-state seeding, non-empty no-op, no reseed after delete, counts reflect seeds.

## Notes

- Aligns with goal-centric column UI from Story 2.4.7.  
- Keep seed content concise and neutral; no lorem ipsum.  
- Safe for production data: never overwrite existing items.
