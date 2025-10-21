# BMAD Missing Files Investigation - Summary

**Date:** 2025-10-21
**Issue:** BMAD Method task files reported as missing (e.g., `brownfield-create-story.md`, `create-next-story.md`)
**Status:** ✅ RESOLVED
**PR:** https://github.com/levineam/Signum/pull/61

---

## Investigation Findings

### Root Cause Analysis

The issue has **three contributing factors**:

1. **Path Mismatch**
   - BMAD agents expect: `.bmad-core/tasks/`, `.bmad-core/data/`, etc.
   - Actual location: `.claude/commands/BMad/tasks/`, `.claude/commands/BMad/data/`, etc.

2. **Gitignore Configuration**
   - `.bmad-core/` directory is gitignored (lines 48-49 of `.gitignore`)
   - Only `core-config.yaml` is tracked
   - Symlinks in `.bmad-core/` are NOT committed to repository

3. **Missing Directories**
   - Only `tasks/` and `agents/` were present in `.claude/commands/BMad/`
   - Missing: `checklists/`, `data/`, `templates/`, `workflows/`, `agent-teams/`
   - These directories contain critical files like `bmad-kb.md` and template files

### Why This Kept Happening

Every time you:
- Clone the repository fresh
- Create a new Conductor workspace
- Switch between workspaces

The `.bmad-core/` symlinks don't exist because:
- They're gitignored (not committed)
- No setup script existed to recreate them
- Missing directories weren't available to link to

---

## Solution Implemented

### 1. Added Missing BMAD Directories (43 files)

Downloaded from https://github.com/bmad-code-org/BMAD-METHOD and added to `.claude/commands/BMad/`:

```
✅ checklists/     (7 files)  - Project management checklists
✅ data/           (6 files)  - Knowledge base including bmad-kb.md
✅ templates/      (13 files) - PRD, architecture, story templates
✅ workflows/      (7 files)  - Multi-step workflow definitions
✅ agent-teams/    (5 files)  - Team configuration files
```

### 2. Created Setup Automation Script

**File:** `scripts/setup-bmad-symlinks.sh`

**Purpose:** Automatically creates symlinks from `.bmad-core/` to `.claude/commands/BMad/`

**Features:**
- Idempotent (safe to run multiple times)
- Verifies critical files after creation
- Clear status output
- Error handling

**Usage:**
```bash
./scripts/setup-bmad-symlinks.sh
```

### 3. Comprehensive Documentation

**File:** `docs/bmad-setup.md`

**Contents:**
- Issue explanation and root cause
- Setup instructions
- Directory structure diagram
- Troubleshooting guide
- Verification steps

---

## Symlinks Created

The setup script creates these symlinks in `.bmad-core/`:

```
.bmad-core/
├── tasks/        → .claude/commands/BMad/tasks/
├── checklists/   → .claude/commands/BMad/checklists/
├── data/         → .claude/commands/BMad/data/
├── templates/    → .claude/commands/BMad/templates/
├── workflows/    → .claude/commands/BMad/workflows/
├── agent-teams/  → .claude/commands/BMad/agent-teams/
└── agents/       → .claude/commands/BMad/agents/
```

All BMAD agent references to `.bmad-core/*` now resolve correctly.

---

## Testing Performed

✅ Setup script creates all symlinks
✅ Critical files accessible:
  - `.bmad-core/tasks/brownfield-create-story.md`
  - `.bmad-core/tasks/create-next-story.md`
  - `.bmad-core/data/bmad-kb.md`
✅ Script is idempotent (ran multiple times successfully)
✅ All 23 task files accessible
✅ All templates, checklists, workflows accessible

---

## How to Use

### For This Workspace

Already set up! Symlinks are in place.

### For New Workspaces/Clones

After cloning the repository:

1. `git clone <repo>`
2. `cd <repo>`
3. `npm install`
4. **`./scripts/setup-bmad-symlinks.sh`** ← Run this!
5. Continue with development

### When BMAD Files Go Missing

If BMAD agents report missing files:

```bash
./scripts/setup-bmad-symlinks.sh
```

This will recreate all symlinks.

---

## Files Added to Repository

### Git-Tracked Files (43 files)

```
.claude/commands/BMad/
├── checklists/          (7 files)
├── data/                (6 files)
├── templates/           (13 files)
├── workflows/           (7 files)
├── agent-teams/         (5 files)
├── agents/              (existing - 10 files)
└── tasks/               (existing - 23 files)

docs/
├── bmad-setup.md        (new documentation)
└── bmad-investigation-summary.md (this file)

scripts/
└── setup-bmad-symlinks.sh (new automation script)
```

### Gitignored Files (created locally)

```
.bmad-core/
├── core-config.yaml     (tracked)
└── [7 symlinks]         (not tracked - created by setup script)
```

---

## Prevention

This issue won't recur because:

1. ✅ All BMAD directories are now in the repository
2. ✅ Setup script automates symlink creation
3. ✅ Documentation explains the issue and solution
4. ✅ Clear instructions for new clones/workspaces

---

## Technical Details

### Why Symlinks?

**Advantages:**
- BMAD framework expects `.bmad-core/` structure
- Files tracked in `.claude/commands/BMad/` for git
- No code changes needed to BMAD agents
- Symlinks bridge the gap transparently

**Why Not Commit Symlinks?**
- `.bmad-core/` is for local state (gitignored)
- Absolute paths in symlinks differ per machine
- Setup script ensures consistency

### BMAD File Resolution

BMAD agents use this pattern (from `bmad-master.md:16-20`):

```yaml
IDE-FILE-RESOLUTION:
  - Dependencies map to .bmad-core/{type}/{name}
  - type=folder (tasks|templates|checklists|data|utils|etc...)
  - Example: create-doc.md → .bmad-core/tasks/create-doc.md
```

With symlinks in place, this resolution now works correctly.

---

## Verification Commands

Check if BMAD is set up correctly:

```bash
# Verify symlinks exist
ls -la .bmad-core/

# Verify critical files accessible
ls .bmad-core/tasks/brownfield-create-story.md
ls .bmad-core/tasks/create-next-story.md
ls .bmad-core/data/bmad-kb.md

# Count task files (should be 23)
ls .bmad-core/tasks/*.md | wc -l

# Or just run the setup script (safe to re-run)
./scripts/setup-bmad-symlinks.sh
```

Expected output from setup script:
```
Setting up BMAD symlinks...
✓ BMAD symlinks created successfully

Verifying critical files...
✓ All critical BMAD files accessible

[lists all symlinks]
```

---

## Related Files

- **Investigation branch:** `bmad-files-investigation`
- **Pull request:** https://github.com/levineam/Signum/pull/61
- **Setup script:** `scripts/setup-bmad-symlinks.sh`
- **Documentation:** `docs/bmad-setup.md`
- **Upstream BMAD:** https://github.com/bmad-code-org/BMAD-METHOD
