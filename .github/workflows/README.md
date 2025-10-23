# Codex Review Automation Setup

## Overview

The `codex-review.yml` workflow automatically requests Codex reviews on every PR push by posting `@codex review` comments.

## Required Setup

### 1. Create a Machine User or Use Personal Account

Codex only responds to mentions from **human accounts**, not from `github-actions[bot]`. You need to:

- **Option A**: Create a dedicated machine user account (e.g., `signum-bot`)
- **Option B**: Use your own personal account

### 2. Add Account as Collaborator

The account must have write access to the repository:

1. Go to **Settings** → **Collaborators**
2. Add the account as a collaborator with **Write** permissions

### 3. Generate Fine-Grained Personal Access Token (PAT)

1. Log in as the machine user (or your account)
2. Go to **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
3. Click **Generate new token**
4. Configure:
   - **Token name**: `codex-review-trigger`
   - **Expiration**: 90 days (or custom)
   - **Repository access**: Select only this repository
   - **Permissions**:
     - `contents`: Read
     - `pull_requests`: Write
5. Click **Generate token** and copy it

### 4. Add Token to Repository Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `CODEX_TRIGGER_PAT`
4. Value: Paste the PAT you copied
5. Click **Add secret**

## How It Works

1. When a PR is opened or updated, the workflow triggers
2. The workflow uses the PAT to comment `@codex review` as the human account
3. Codex sees the mention from a human account and responds with a review
4. No duplicate comments are created since we rely on Codex's own deduplication

## Troubleshooting

**Workflow fails with 401 error:**
- Check that `CODEX_TRIGGER_PAT` secret exists
- Verify the PAT hasn't expired
- Confirm the PAT has correct permissions

**Codex doesn't respond:**
- Verify the account is a collaborator on the repo
- Check that Codex is enabled for the repository
- Try manually commenting `@codex review` from the same account to test

**Multiple review requests:**
- This is expected behavior - the workflow will post on every push
- Codex handles deduplication internally and won't re-review unchanged code
