#!/bin/bash

# Sync .env.local from the current worktree to every git worktree
# Ensures all workspaces share identical environment variables

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/.." && pwd))"
ENV_FILE="${REPO_ROOT}/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: ${ENV_FILE} not found!"
    echo "Please create .env.local with the required values before syncing."
    exit 1
fi

worktrees=()
while IFS= read -r line; do
    case "$line" in
        worktree\ *)
            worktrees+=("${line#worktree }")
            ;;
    esac
done < <(git -C "$REPO_ROOT" worktree list --porcelain)

if [ ${#worktrees[@]} -eq 0 ]; then
    echo "⚠️  No worktrees detected. Nothing to sync."
    exit 0
fi

echo "🔄 Syncing .env.local to all git worktrees..."
echo ""

synced=0
skipped=0

for worktree in "${worktrees[@]}"; do
    if [ ! -d "$worktree" ]; then
        echo "⏭️  Skipping ${worktree} (missing directory)"
        ((skipped++))
        continue
    fi

    if [ "$worktree" = "$REPO_ROOT" ]; then
        continue
    fi

    target_env="${worktree}/.env.local"
    cp "$ENV_FILE" "$target_env"
    echo "✅ Synced to ${worktree}"
    ((synced++))
done

echo ""
echo "✨ Sync complete!"
echo "   Synced: $synced worktrees"
if [ $skipped -gt 0 ]; then
    echo "   Skipped: $skipped paths"
fi
echo ""
echo "💡 Tip: Run this script (or rely on the git hooks) whenever .env.local changes."
