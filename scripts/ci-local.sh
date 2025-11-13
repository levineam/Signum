#!/bin/bash
# Mirror CI pipeline execution locally for debugging
# Usage: ./scripts/ci-local.sh

set -e

echo "🔍 Running CI pipeline locally..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to run stage
run_stage() {
  local stage_name=$1
  local command=$2

  echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Stage: $stage_name${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

  if eval "$command"; then
    echo -e "${GREEN}✅ $stage_name PASSED${NC}"
  else
    echo -e "${RED}❌ $stage_name FAILED${NC}"
    FAILURES=$((FAILURES + 1))
  fi

  echo ""
}

# Stage 1: Lint
run_stage "Lint" "npm run lint"

# Stage 2: Type Check
run_stage "Type Check" "npm run typecheck"

# Stage 3: Build
run_stage "Build" "npm run build"

# Stage 4: Unit Tests
run_stage "Unit Tests" "npm run test:unit"

# Stage 5: E2E Smoke Tests
run_stage "E2E Smoke Tests" "npm run test:e2e:smoke"

# Stage 6: Burn-in (reduced iterations for local)
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}Stage: Burn-in Loop (3 iterations)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"

BURN_IN_FAILED=0
for i in {1..3}; do
  echo "🔥 Burn-in iteration $i/3"

  if npm run test:e2e:smoke > /dev/null 2>&1; then
    echo "  ✅ Iteration $i passed"
  else
    echo "  ❌ Iteration $i failed"
    BURN_IN_FAILED=1
    FAILURES=$((FAILURES + 1))
    break
  fi
done

if [ $BURN_IN_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ Burn-in PASSED${NC}"
else
  echo -e "${RED}❌ Burn-in FAILED (flaky tests detected!)${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "CI Pipeline Summary"
echo "═══════════════════════════════════════════════"

if [ $FAILURES -eq 0 ]; then
  echo -e "${GREEN}✅ All stages passed! Ready to push.${NC}"
  exit 0
else
  echo -e "${RED}❌ $FAILURES stage(s) failed. Fix issues before pushing.${NC}"
  exit 1
fi
