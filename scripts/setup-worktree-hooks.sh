#!/bin/bash

# Setup git hooks to automatically sync .env.local to worktrees
# This runs the sync script after certain git operations

set -e

MAIN_REPO="/Users/andrewleveiss/Signum"
HOOKS_DIR="${MAIN_REPO}/.git/hooks"

echo "🔧 Setting up git hooks for automatic .env.local sync..."
echo ""

# Create post-checkout hook
cat > "${HOOKS_DIR}/post-checkout" << 'EOF'
#!/bin/bash

# Auto-sync .env.local to all worktrees after checkout
# This ensures new worktrees get the latest environment config

MAIN_REPO="/Users/andrewleveiss/Signum"
SYNC_SCRIPT="${MAIN_REPO}/scripts/sync-env-to-worktrees.sh"

# Only run if we're in the main repo and the sync script exists
if [ -f "$SYNC_SCRIPT" ] && [ "$PWD" = "$MAIN_REPO" ]; then
    echo ""
    echo "🔄 Auto-syncing .env.local to worktrees..."
    "$SYNC_SCRIPT"
fi
EOF

chmod +x "${HOOKS_DIR}/post-checkout"
echo "✅ Created post-checkout hook"

# Create post-merge hook
cat > "${HOOKS_DIR}/post-merge" << 'EOF'
#!/bin/bash

# Auto-sync .env.local to all worktrees after merge
# Ensures worktrees stay in sync when main repo updates

MAIN_REPO="/Users/andrewleveiss/Signum"
SYNC_SCRIPT="${MAIN_REPO}/scripts/sync-env-to-worktrees.sh"

# Only run if we're in the main repo and the sync script exists
if [ -f "$SYNC_SCRIPT" ] && [ "$PWD" = "$MAIN_REPO" ]; then
    echo ""
    echo "🔄 Auto-syncing .env.local to worktrees..."
    "$SYNC_SCRIPT"
fi
EOF

chmod +x "${HOOKS_DIR}/post-merge"
echo "✅ Created post-merge hook"

echo ""
echo "✨ Git hooks installed successfully!"
echo ""
echo "📋 Hooks will auto-sync .env.local to worktrees after:"
echo "   • git checkout (switching branches)"
echo "   • git merge (merging branches)"
echo "   • Creating new worktrees (via post-checkout)"
echo ""
echo "💡 You can still manually sync anytime with:"
echo "   ./scripts/sync-env-to-worktrees.sh"
