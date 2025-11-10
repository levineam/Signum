#!/bin/bash

# Sync .env.local from main repo to all Conductor worktrees
# This ensures all workspaces have the same environment variables (Sentry, API keys, etc.)

set -e

MAIN_REPO="/Users/andrewleveiss/Signum"
CONDUCTOR_DIR="${MAIN_REPO}/.conductor"
ENV_FILE="${MAIN_REPO}/.env.local"

# Check if main .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: ${ENV_FILE} not found!"
    echo "Please ensure .env.local exists in the main repo with all required variables."
    exit 1
fi

echo "🔄 Syncing .env.local to all Conductor worktrees..."
echo ""

# Counter for tracking
synced=0
skipped=0

# Loop through all directories in .conductor
for worktree_dir in "$CONDUCTOR_DIR"/*; do
    if [ -d "$worktree_dir" ]; then
        worktree_name=$(basename "$worktree_dir")
        target_env="${worktree_dir}/.env.local"

        # Skip if it's not a valid worktree (e.g., doha which appears empty)
        if [ ! -d "${worktree_dir}/.git" ] && [ ! -f "${worktree_dir}/.git" ]; then
            echo "⏭️  Skipping ${worktree_name} (not a valid worktree)"
            ((skipped++))
            continue
        fi

        # Copy .env.local
        cp "$ENV_FILE" "$target_env"
        echo "✅ Synced to ${worktree_name}"
        ((synced++))
    fi
done

echo ""
echo "✨ Sync complete!"
echo "   Synced: $synced worktrees"
if [ $skipped -gt 0 ]; then
    echo "   Skipped: $skipped directories"
fi
echo ""
echo "💡 Tip: Run this script whenever you update .env.local in the main repo"
echo "   or after creating a new Conductor workspace."
