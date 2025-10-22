#!/bin/bash
# BMAD Method Setup Script
# Creates symlinks from .bmad-core/ to .claude/commands/BMad/ directories
# This ensures BMAD agents can find their task files in the expected location

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo "Setting up BMAD symlinks..."

# Create .bmad-core directory if it doesn't exist
mkdir -p .bmad-core

# Remove existing symlinks (if any)
for dir in tasks checklists data templates workflows agent-teams agents; do
  if [ -L ".bmad-core/$dir" ]; then
    rm ".bmad-core/$dir"
  fi
done

# Create symlinks
ln -sf "$PROJECT_ROOT/.claude/commands/BMad/tasks" .bmad-core/tasks
ln -sf "$PROJECT_ROOT/.claude/commands/BMad/checklists" .bmad-core/checklists
ln -sf "$PROJECT_ROOT/.claude/commands/BMad/data" .bmad-core/data
ln -sf "$PROJECT_ROOT/.claude/commands/BMad/templates" .bmad-core/templates
ln -sf "$PROJECT_ROOT/.claude/commands/BMad/workflows" .bmad-core/workflows
ln -sf "$PROJECT_ROOT/.claude/commands/BMad/agent-teams" .bmad-core/agent-teams
ln -sf "$PROJECT_ROOT/.claude/commands/BMad/agents" .bmad-core/agents

echo "✓ BMAD symlinks created successfully"
echo ""
echo "Verifying critical files..."

# Verify critical files
if [ -f .bmad-core/tasks/brownfield-create-story.md ] && \
   [ -f .bmad-core/tasks/create-next-story.md ] && \
   [ -f .bmad-core/data/bmad-kb.md ]; then
  echo "✓ All critical BMAD files accessible"
else
  echo "✗ Warning: Some BMAD files may be missing"
  exit 1
fi

ls -la .bmad-core/
