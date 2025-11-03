#!/usr/bin/env node
/**
 * Auto-migrate API routes from console.* to Pino logger
 * Story 2.4.6 Phase 2: Structured Logging Migration
 */

const fs = require('fs')
const path = require('path')

// Routes to migrate
const routes = [
  'src/app/api/extract-ontology/route.ts',
  'src/app/api/ontology/analysis-state/route.ts',
  'src/app/api/ontology/incremental-analysis/route.ts',
  'src/app/api/tasks/[taskId]/route.ts',
  'src/app/api/tasks/bulk/route.ts',
  'src/app/api/tasks/parse/route.ts',
  'src/app/api/transcribe/route.ts',
  'src/app/api/import/obsidian/route.ts'
]

console.log('🔄 Auto-migrating API routes to Pino logging...\n')

let totalReplacements = 0

routes.forEach(routePath => {
  const fullPath = path.join(process.cwd(), routePath)

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${routePath} (not found)`)
    return
  }

  console.log(`📝 Processing ${routePath}...`)

  let content = fs.readFileSync(fullPath, 'utf8')
  let replacements = 0

  // Add import if not present
  if (!content.includes("import logger from '@/utils/logger'")) {
    // Find the last import statement
    const importRegex = /^import .* from .*$/gm
    const imports = content.match(importRegex)
    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1]
      content = content.replace(lastImport, lastImport + "\nimport logger from '@/utils/logger'")
      console.log('   ✅ Added logger import')
      replacements++
    }
  }

  // Replace console.error patterns
  // Pattern: console.error('message', value) -> logger.error({ context }, 'message')
  const consoleErrorMatches = content.match(/console\.error\([^)]+\)/g) || []
  consoleErrorMatches.forEach(match => {
    // Extract route name from file path
    const routeName = routePath.split('/').slice(-2, -1)[0] || 'api'

    // Simple replacement - convert to logger.error with route context
    const simplified = match
      .replace(/console\.error\(/, 'logger.error({ route: \'' + routeName + '\' }, ')

    content = content.replace(match, simplified)
    replacements++
  })

  // Replace console.log patterns
  const consoleLogMatches = content.match(/console\.log\([^)]+\)/g) || []
  consoleLogMatches.forEach(match => {
    const routeName = routePath.split('/').slice(-2, -1)[0] || 'api'

    const simplified = match
      .replace(/console\.log\(/, 'logger.debug({ route: \'' + routeName + '\' }, ')

    content = content.replace(match, simplified)
    replacements++
  })

  // Replace console.warn patterns
  const consoleWarnMatches = content.match(/console\.warn\([^)]+\)/g) || []
  consoleWarnMatches.forEach(match => {
    const routeName = routePath.split('/').slice(-2, -1)[0] || 'api'

    const simplified = match
      .replace(/console\.warn\(/, 'logger.warn({ route: \'' + routeName + '\' }, ')

    content = content.replace(match, simplified)
    replacements++
  })

  // Replace console.info patterns
  const consoleInfoMatches = content.match(/console\.info\([^)]+\)/g) || []
  consoleInfoMatches.forEach(match => {
    const routeName = routePath.split('/').slice(-2, -1)[0] || 'api'

    const simplified = match
      .replace(/console\.info\(/, 'logger.info({ route: \'' + routeName + '\' }, ')

    content = content.replace(match, simplified)
    replacements++
  })

  // Replace console.debug patterns
  const consoleDebugMatches = content.match(/console\.debug\([^)]+\)/g) || []
  consoleDebugMatches.forEach(match => {
    const routeName = routePath.split('/').slice(-2, -1)[0] || 'api'

    const simplified = match
      .replace(/console\.debug\(/, 'logger.debug({ route: \'' + routeName + '\' }, ')

    content = content.replace(match, simplified)
    replacements++
  })

  if (replacements > 0) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`   ✅ Made ${replacements} replacements`)
    totalReplacements += replacements
  } else {
    console.log('   ℹ️  No console.* statements found')
  }

  console.log('')
})

console.log('=' .repeat(60))
console.log(`✅ Migration complete!`)
console.log(`   Total replacements: ${totalReplacements}`)
console.log(`   Routes processed: ${routes.length}`)
console.log('=' .repeat(60))
console.log('\nNext steps:')
console.log('1. Review changes with: git diff')
console.log('2. Test build: npm run build')
console.log('3. Update .env.example')
console.log('4. Commit changes')
