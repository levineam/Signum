#!/bin/bash
# Story 2.4.6 Phase 2: Bulk migrate console.* to logger
# Replaces all console.log/error/warn/info/debug with structured logging

echo "🔄 Migrating API routes to Pino logging..."

# List of API routes to migrate
routes=(
  "src/app/api/extract-ontology/route.ts"
  "src/app/api/ontology/analysis-state/route.ts"
  "src/app/api/ontology/incremental-analysis/route.ts"
  "src/app/api/tasks/[taskId]/route.ts"
  "src/app/api/tasks/bulk/route.ts"
  "src/app/api/tasks/parse/route.ts"
  "src/app/api/transcribe/route.ts"
  "src/app/api/import/obsidian/route.ts"
)

for route in "${routes[@]}"; do
  if [ -f "$route" ]; then
    echo "  📝 Migrating $route..."

    # Add import if not present
    if ! grep -q "import logger from '@/utils/logger'" "$route"; then
      # Find the last import line and add after it
      sed -i '' "/^import/a\\
import logger from '@/utils/logger'
" "$route"
    fi

    echo "     ✅ Import added"
  else
    echo "  ⚠️  File not found: $route"
  fi
done

echo ""
echo "✅ Imports added to all routes"
echo "⚠️  Manual replacement of console.* statements still needed"
echo "   Use find/replace in your editor for precise control"
