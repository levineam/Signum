#!/bin/bash
# Run only tests for changed files
# Usage: ./scripts/test-changed.sh [base-branch]

set -e

BASE_BRANCH="${1:-main}"

echo "🔍 Detecting changed files since $BASE_BRANCH..."

# Get list of changed files
CHANGED_FILES=$(git diff --name-only "$BASE_BRANCH"...HEAD)

if [ -z "$CHANGED_FILES" ]; then
  echo "No changed files detected. Running full test suite..."
  npm run test:e2e
  exit 0
fi

echo "Changed files:"
echo "$CHANGED_FILES"
echo ""

# Check if test-affecting changes exist
if echo "$CHANGED_FILES" | grep -qE '\.(ts|tsx|js|jsx)$'; then
  echo "✅ Code changes detected. Running affected tests..."

  # Extract test file paths
  TEST_FILES=$(echo "$CHANGED_FILES" \
    | grep -E 'tests/.*\.(spec|test)\.(ts|tsx)$' \
    | tr '\n' ' ')

  if [ -n "$TEST_FILES" ]; then
    echo "Running test files: $TEST_FILES"
    npx playwright test $TEST_FILES
  else
    echo "No direct test file changes. Running smoke tests..."
    npm run test:e2e:smoke
  fi
else
  echo "ℹ️  No test-affecting changes detected."
  echo "Running smoke tests as safety check..."
  npm run test:e2e:smoke
fi

echo ""
echo "✅ Selective testing complete!"
