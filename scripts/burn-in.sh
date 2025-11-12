#!/bin/bash
# Standalone burn-in loop for flaky test detection
# Usage: ./scripts/burn-in.sh [iterations] [test-command]

set -e

ITERATIONS="${1:-10}"
TEST_COMMAND="${2:-npm run test:e2e:smoke}"

echo "🔥 Starting burn-in loop: $ITERATIONS iterations"
echo "Test command: $TEST_COMMAND"
echo ""

FAILED_ITERATIONS=()

for i in $(seq 1 "$ITERATIONS"); do
  echo "═══════════════════════════════════════════════"
  echo "🔥 Iteration $i/$ITERATIONS"
  echo "═══════════════════════════════════════════════"

  if eval "$TEST_COMMAND"; then
    echo "✅ Iteration $i passed"
  else
    echo "❌ Iteration $i FAILED"
    FAILED_ITERATIONS+=("$i")
  fi

  echo ""
done

echo "═══════════════════════════════════════════════"
echo "Burn-in Results"
echo "═══════════════════════════════════════════════"

if [ ${#FAILED_ITERATIONS[@]} -eq 0 ]; then
  echo "✅ All $ITERATIONS iterations passed!"
  echo "Tests are stable and non-flaky."
  exit 0
else
  echo "❌ FLAKY TESTS DETECTED!"
  echo "Failed iterations: ${FAILED_ITERATIONS[*]}"
  echo "Failure rate: ${#FAILED_ITERATIONS[@]}/$ITERATIONS ($(echo "scale=2; ${#FAILED_ITERATIONS[@]} * 100 / $ITERATIONS" | bc)%)"
  echo ""
  echo "Action required:"
  echo "1. Review test-results/ directory for failure details"
  echo "2. Identify non-deterministic behavior (timing, race conditions, etc.)"
  echo "3. Fix flaky tests before merging"
  exit 1
fi
