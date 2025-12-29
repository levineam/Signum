# Signum Runbooks

Operational runbooks for development workflows, testing strategies, and critical procedures.

## Quick Start

### For AI Coding Agents

When implementing features, reference these runbooks for critical procedures:

1. **Check `.claude/CLAUDE.md`** for high-level warnings and links
2. **Jump directly to specific runbook** for detailed procedures
3. **Follow step-by-step instructions** to avoid common mistakes

### For Human Developers

Browse by category below or use search to find specific procedures.

## Testing & Development

### [Local Testing Guide](./local-testing-guide.md)

How to test locally without Supabase using test mode.

**Use when:**
- Working on UI/component changes
- Developing E2E tests
- Wanting fast iteration cycles (30 seconds vs 5-10 minutes)

**Key sections:**
- Quick Start (3 commands)
- What Works / Doesn't Work
- Typical workflows
- Playwright E2E with two-config approach (`.noserver.ts` for local dev)

### [Testing Decision Matrix](./TESTING_DECISION_MATRIX.md)

Quick reference for choosing the right testing approach.

**Use when:**
- Unsure whether to test locally or on Vercel preview
- Planning development workflow for a new feature
- Need to explain testing strategy to team

**Key sections:**
- Decision Tree
- Detailed Matrix (by change type)
- Mode Characteristics comparison

## Database Operations

### [Database Index Management](./database-index-management.md) 🆕

Critical procedures for analyzing and dropping unused PostgreSQL indexes.

**Use when:**
- Optimizing database performance
- Analyzing unused indexes with `pg_stat_user_indexes`
- Working on database migrations that modify constraints

**Key sections:**
- Quick Reference table
- Step-by-step verification checklist (7 steps for unique constraints)
- Real-world example (Epic 1.11)
- Decision tree

**⚠️ CRITICAL:** Never drop indexes based on `idx_scan = 0` alone!

### [Ontology Incremental Analysis](./ontology-incremental.md)

Architecture and procedures for incremental ontology extraction.

**Use when:**
- Debugging ontology analysis issues
- Understanding daily scheduled extraction
- Working on ontology-related features

**Key sections:**
- System architecture
- Data flow diagrams
- Component breakdown

## Editor & UI

### [HTML Formatting Guide](./html-formatting-guide.md) 🆕

Step-by-step procedures for adding formatting features to SimpleRichEditor.

**Use when:**
- Adding new rich text formatting (bold, highlight, etc.)
- Debugging formatting that works in editor but disappears when viewing
- Understanding DOMPurify whitelisting

**Key sections:**
- Step-by-step guide (6 steps)
- Common failure modes
- Decision tree
- Examples (strikethrough, highlight with color)

**⚠️ CRITICAL:** Must update BOTH edit mode AND read-only mode or formatting will be stripped!

### [Writing Spark Guide](./writing-spark-guide.md) 🆕

Architecture and procedures for the ontology-based writing spark system.

**Use when:**
- Understanding how journal prompts are generated
- Debugging spark loading issues
- Working on the right panel layout
- Modifying the ontology analysis logic

**Key sections:**
- System architecture (ASCII diagram)
- Guiding principles (UX anti-patterns to avoid)
- Responsive layout behavior
- Integration points (seed-journal-entry event)
- Troubleshooting

## Verification Procedures

### [Verify Helper Types Constraint](./verify-helper-types-constraint.md)

SQL queries to verify helper_types constraint after migration.

**Use when:**
- Verifying database constraints after deployment
- Testing Epic 1.7 helper tagging features

## Runbook Index by Use Case

### 🆕 Adding New Features

| Feature Type | Primary Runbook | Supporting Runbooks |
|-------------|----------------|---------------------|
| UI Component | [Testing Decision Matrix](./TESTING_DECISION_MATRIX.md) | [Local Testing Guide](./local-testing-guide.md) |
| Rich Text Formatting | [HTML Formatting Guide](./html-formatting-guide.md) | [Local Testing Guide](./local-testing-guide.md) |
| Database Schema | [Database Index Management](./database-index-management.md) | *Test on Vercel only* |
| Ontology Feature | [Ontology Incremental](./ontology-incremental.md) | [Testing Decision Matrix](./TESTING_DECISION_MATRIX.md) |
| Writing Spark / Homepage Widgets | [Writing Spark Guide](./writing-spark-guide.md) | [Local Testing Guide](./local-testing-guide.md) |

### 🐛 Debugging Issues

| Symptom | Likely Runbook |
|---------|----------------|
| Formatting disappears when viewing saved content | [HTML Formatting Guide](./html-formatting-guide.md) → Troubleshooting |
| Slow local iteration cycles | [Testing Decision Matrix](./TESTING_DECISION_MATRIX.md) → Use test mode |
| Migration drops critical constraint | [Database Index Management](./database-index-management.md) → Verification checklist |
| Ontology analysis not running | [Ontology Incremental](./ontology-incremental.md) → Troubleshooting |
| Writing spark not loading | [Writing Spark Guide](./writing-spark-guide.md) → Troubleshooting |
| Right panel not showing on desktop | [Writing Spark Guide](./writing-spark-guide.md) → Troubleshooting |

### 🔍 Understanding Architecture

| Component | Runbook |
|-----------|---------|
| Test mode architecture | [Local Testing Guide](./local-testing-guide.md) → How It Works |
| Ontology extraction pipeline | [Ontology Incremental](./ontology-incremental.md) → Architecture |
| Database constraints | [Database Index Management](./database-index-management.md) → Three Purposes |
| HTML sanitization | [HTML Formatting Guide](./html-formatting-guide.md) → Security Considerations |
| Writing spark system | [Writing Spark Guide](./writing-spark-guide.md) → Architecture |
| Homepage layout / Right panel | [Writing Spark Guide](./writing-spark-guide.md) → Responsive Layout |

## Contributing to Runbooks

When creating a new runbook, follow these best practices (from 2024 industry research):

### Structure

1. **Front Matter:**
   - Story/Epic reference (optional)
   - Last Updated date
   - Owner/Team

2. **Overview:**
   - 2-3 sentence summary
   - Link to related documentation

3. **Quick Reference:**
   - Tables for at-a-glance information
   - Decision trees (ASCII art)

4. **Step-by-Step Procedures:**
   - Numbered steps
   - Code examples with syntax highlighting
   - Clear checkboxes (✅/❌)

5. **Troubleshooting:**
   - Common issues with symptoms
   - Diagnosis steps
   - Fixes

6. **References:**
   - Links to related docs
   - External resources

### Style Guidelines

- ✅ **Use tables** for quick reference
- ✅ **Use decision trees** for complex choices
- ✅ **Use emojis** for visual scanning (⚠️ 🆕 ✅ ❌)
- ✅ **Keep focused** - one procedure per runbook
- ✅ **Test diversity** - ensure all skill levels can follow
- ❌ **Avoid jargon** - explain technical terms
- ❌ **Don't duplicate** - link to other runbooks instead

### Naming Conventions

- Use kebab-case: `database-index-management.md`
- Be specific: `html-formatting-guide.md` not `editor-guide.md`
- Avoid version numbers in filenames

### Maintenance

- **Review quarterly** - update for tech changes
- **Assign ownership** - each runbook has a team/person
- **Track usage** - deprecate unused runbooks
- **Update Last Updated** - whenever content changes

## Questions or Feedback?

- Found an error? Open an issue or PR
- Need a new runbook? Create an issue with the `documentation` label
- Runbook unclear? Add a comment in the PR that added it

## Quick Links

- [Project Instructions (CLAUDE.md)](../../.claude/CLAUDE.md)
- [Product Requirements (PRD)](../prd.md)
- [Analysis Reports](../analysis/)
