#!/bin/bash

# Setup git hooks to automatically sync .env.local to every git worktree
# Hooks call the sync script after key git operations (checkout, merge)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || (cd "$SCRIPT_DIR/.." && pwd))"

echo "🔧 Setting up git hooks for automatic .env.local sync..."
echo ""

if ! git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "❌ Error: Unable to locate git repository from $REPO_ROOT" >&2
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
    echo "❌ Error: No worktrees found. Run this script from a git worktree." >&2
    exit 1
fi

install_hook() {
    local hook_dir="$1"
    local hook_name="$2"
    local hook_path="${hook_dir}/${hook_name}"

    mkdir -p "$hook_dir"

    cat > "$hook_path" <<'HOOK'
#!/bin/bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"

if [ -z "$REPO_ROOT" ]; then
    exit 0
fi

SYNC_SCRIPT="${REPO_ROOT}/scripts/sync-env-to-worktrees.sh"

if [ -f "$SYNC_SCRIPT" ]; then
    echo ""
    echo "🔄 Auto-syncing .env.local to worktrees..."
    bash "$SYNC_SCRIPT"
fi
HOOK

    chmod +x "$hook_path"
    echo "   • Installed ${hook_name}"
}

resolve_hooks_dir() {
    local worktree_path="$1"
    local hooks_path
    hooks_path="$(git -C "$worktree_path" rev-parse --git-path hooks)"

    if [[ "$hooks_path" != /* ]]; then
        hooks_path="${worktree_path}/${hooks_path}"
    fi

    echo "$hooks_path"
}

for worktree in "${worktrees[@]}"; do
    if [ ! -d "$worktree" ]; then
        echo "⏭️  Skipping missing worktree: $worktree"
        continue
    fi

    echo "🔗 Installing hooks for ${worktree}"
    hooks_dir="$(resolve_hooks_dir "$worktree")"

    install_hook "$hooks_dir" "post-checkout"
    install_hook "$hooks_dir" "post-merge"
    echo "✅ Hooks ready for ${worktree}"
    echo ""
done

echo "✨ Git hooks installed successfully!"
echo ""
echo "📋 Hooks will auto-sync .env.local to worktrees after:"
echo "   • git checkout (branch switches)"
echo "   • git merge"
echo ""
echo "💡 Run ./scripts/sync-env-to-worktrees.sh anytime for a manual sync."
