# BMAD Method Setup & Troubleshooting

## Overview

This project uses the BMAD Method framework for AI-assisted development workflows in **Conductor workspaces**. This setup is primarily for development use within Conductor's multi-workspace environment.

BMAD files are stored in `.claude/commands/BMad/` but agents expect them in `.bmad-core/`.

## The Missing Files Issue

**Symptom:** BMAD agents report missing files like `tasks/brownfield-create-story.md` or `tasks/create-next-story.md`

**Root Cause:**
1. BMAD agents look for files in `.bmad-core/tasks/`, `.bmad-core/data/`, etc.
2. Actual files are stored in `.claude/commands/BMad/` (tracked by git)
3. `.bmad-core/` is gitignored (except `core-config.yaml`)
4. Symlinks bridge the gap, but they're not committed to git

**Why this happens:**
- When you clone the repo or switch workspaces, `.bmad-core/` symlinks don't exist
- The `.gitignore` file excludes `.bmad-core/` (lines 48-49)
- This is intentional - BMAD keeps local state in `.bmad-core/`

## Solution

Run the setup script after cloning or when BMAD files are reported missing:

```bash
./scripts/setup-bmad-symlinks.sh
```

This creates symlinks from `.bmad-core/` to `.claude/commands/BMad/` directories:
- `tasks/` → 23 task definition files
- `checklists/` → Project checklists
- `data/` → Knowledge base and reference data
- `templates/` → Document templates
- `workflows/` → Multi-step workflows
- `agents/` → Agent persona definitions
- `agent-teams/` → Team configurations

## Verification

After running the setup script, verify files are accessible:

```bash
ls .bmad-core/tasks/brownfield-create-story.md
ls .bmad-core/tasks/create-next-story.md
ls .bmad-core/data/bmad-kb.md
```

All should exist and be accessible.

## Directory Structure

```
.bmad-core/              # Gitignored (local state)
├── core-config.yaml     # Only file tracked by git
├── tasks/              # → Symlink to .claude/commands/BMad/tasks/
├── checklists/         # → Symlink to .claude/commands/BMad/checklists/
├── data/               # → Symlink to .claude/commands/BMad/data/
├── templates/          # → Symlink to .claude/commands/BMad/templates/
├── workflows/          # → Symlink to .claude/commands/BMad/workflows/
├── agent-teams/        # → Symlink to .claude/commands/BMad/agent-teams/
└── agents/             # → Symlink to .claude/commands/BMad/agents/

.claude/commands/BMad/   # Git-tracked BMAD files
├── tasks/              # 23 task definitions
├── checklists/         # Project checklists
├── data/               # Knowledge base files
├── templates/          # Document templates
├── workflows/          # Multi-step workflows
├── agent-teams/        # Team configurations
└── agents/             # Agent personas
```

## For New Conductor Workspaces

When creating new Conductor workspaces (via `git worktree` or fresh clones):

1. Clone repository or create worktree
2. Run `npm install`
3. **Run `./scripts/setup-bmad-symlinks.sh`** ← Important!
4. Continue with normal setup

**Note:** This BMAD setup is specifically for development workflows within Conductor. If you're cloning this repo for other purposes, you can safely ignore the BMAD setup.

## Troubleshooting

**Q: Agent says "file not found" for BMAD tasks**
A: Run `./scripts/setup-bmad-symlinks.sh`

**Q: Symlinks break after git operations**
A: Re-run `./scripts/setup-bmad-symlinks.sh`

**Q: Want to update BMAD files from upstream**
A: Files in `.claude/commands/BMad/` are git-tracked, just pull/merge normally

**Q: Should I commit symlinks?**
A: No, they're gitignored. Each developer/workspace runs the setup script locally.
