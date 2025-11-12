# Conductor Worktree + Sentry Integration

This document explains how Sentry is automatically synchronized across all Conductor workspaces/worktrees.

## 🎯 Problem Solved

When working with multiple Conductor workspaces (worktrees), each needs its own `.env.local` file with Sentry credentials. Manually copying these files is error-prone and easy to forget. This solution automates the process.

## 🔧 How It Works

### 1. **Main Repository as Source of Truth**
   - `/Users/andrewleveiss/Signum/.env.local` contains the master copy of all environment variables
   - This includes Sentry DSN, auth token, and all other API keys

### 2. **Automatic Sync via Git Hooks**
   - Git hooks automatically run `sync-env-to-worktrees.sh` after:
     - Creating new worktrees (`git worktree add`)
     - Checking out branches
     - Merging branches
   - This ensures worktrees always have the latest environment config

### 3. **Manual Sync Script**
   - `scripts/sync-env-to-worktrees.sh` can be run anytime to manually sync
   - Useful if you update `.env.local` and want immediate sync

## 📋 Setup Instructions

### Initial Setup (One-Time)

1. **Ensure main repo has Sentry configured**:
   ```bash
   cd /Users/andrewleveiss/Signum

   # Verify .env.local has Sentry variables:
   grep SENTRY .env.local
   # Should show:
   # NEXT_PUBLIC_SENTRY_DSN=https://...
   # SENTRY_AUTH_TOKEN=...
   ```

2. **Install git hooks** (from main repo):
   ```bash
   cd /Users/andrewleveiss/Signum
   ./scripts/setup-worktree-hooks.sh
   ```

3. **Sync to all existing worktrees**:
   ```bash
   cd /Users/andrewleveiss/Signum
   ./scripts/sync-env-to-worktrees.sh
   ```

### Creating New Worktrees

When you create a new Conductor workspace, the git hooks will automatically sync `.env.local`:

```bash
cd /Users/andrewleveiss/Signum
git worktree add .conductor/new-workspace-name -b branch-name
# Hooks automatically run sync script ✅
```

If the automatic sync doesn't trigger, manually run:
```bash
./scripts/sync-env-to-worktrees.sh
```

### Updating Environment Variables

When you update `.env.local` in the main repo (e.g., rotating Sentry tokens):

```bash
cd /Users/andrewleveiss/Signum

# Edit .env.local with new values
nano .env.local

# Sync to all worktrees
./scripts/sync-env-to-worktrees.sh
```

## 🔍 What Gets Synced

The entire `.env.local` file is copied, including:
- ✅ Sentry DSN and auth token
- ✅ Supabase credentials
- ✅ OpenAI API key
- ✅ Feature flags
- ✅ Any other environment variables

## 📁 File Locations

```
/Users/andrewleveiss/Signum/
├── .env.local                           # Master copy (source of truth)
├── .env.example                         # Template with Sentry variables
├── scripts/
│   ├── sync-env-to-worktrees.sh        # Sync script
│   └── setup-worktree-hooks.sh         # Hook installer
├── .git/hooks/
│   ├── post-checkout                    # Auto-runs sync after checkout
│   └── post-merge                       # Auto-runs sync after merge
└── .conductor/
    ├── pattaya/.env.local              # Synced copy
    ├── budapest/.env.local             # Synced copy
    ├── cebu/.env.local                 # Synced copy
    └── ...                              # All other worktrees
```

## 🧪 Verification

To verify Sentry is working in a worktree:

```bash
cd /Users/andrewleveiss/Signum/.conductor/pattaya

# Check .env.local has Sentry vars
grep SENTRY .env.local

# Run build to verify Sentry integration
npm run build

# Look for Sentry output during build:
# "Info: Successfully uploaded source maps to Sentry"
```

## 🚨 Troubleshooting

### Worktree missing .env.local
```bash
cd /Users/andrewleveiss/Signum
./scripts/sync-env-to-worktrees.sh
```

### Git hooks not running
```bash
cd /Users/andrewleveiss/Signum
./scripts/setup-worktree-hooks.sh
```

### Worktree behind on Sentry commits
```bash
cd /Users/andrewleveiss/Signum/.conductor/your-worktree
git fetch origin
git merge origin/main  # or git rebase origin/main
```

The Sentry integration requires:
- `src/instrumentation.ts` (server-side)
- `src/instrumentation-client.ts` (client-side)
- `src/app/global-error.tsx` (error boundary)
- `next.config.ts` (Sentry webpack plugin)

These files come from commits `19687814` and `6042100e`.

## 🔗 Related Links

- [Sentry Dashboard](https://sentry.io/organizations/jotes/issues/?project=4510319000092672)
- [Sentry Project Settings](https://sentry.io/settings/jotes/projects/jotes/)
- [Main Repo Sentry Setup Summary](#) (see initial conversation)

## 💡 Best Practices

1. **Always update .env.local in main repo first**, then sync to worktrees
2. **Never commit .env.local** (it's in .gitignore)
3. **Keep .env.example up to date** when adding new variables
4. **Run sync script after rotating API keys** to update all worktrees
5. **Verify Sentry in Vercel previews** before merging PRs
