# MCP Server Reference Guide

This document provides reference information for the MCP (Model Context Protocol) servers available in the development environment. For project-specific instructions, see the main CLAUDE.md file.

## Available MCP Servers

### Context7
**Purpose**: Real-time library documentation and code examples

**When to use**: Automatically used by Claude Code for up-to-date documentation when working with libraries and frameworks.

**Key capabilities**:
- Version-specific documentation
- Code snippet examples
- Reduced hallucinations through current documentation

### Supabase
**Purpose**: Database operations and project management

**Key capabilities**:
- Execute SQL queries and migrations
- Generate TypeScript types
- Manage database schema
- View logs and run advisors

**Security note**: All database operations require manual approval. Never bypass permission checks.

### Playwright
**Purpose**: Browser automation and E2E testing

**Key capabilities**:
- Write and run automated tests
- Browser interaction simulation
- Test generation from natural language

**Usage**: Available for E2E testing workflow described in PRD.

### shadcn/ui
**Purpose**: UI component information and usage

**Key capabilities**:
- Component documentation
- Usage examples
- 200+ pre-built components

**Note**: Signum uses the Notebook theme variant.

## General Best Practices

1. **Always approve tool calls manually** - Review database operations and destructive actions
2. **Use read-only mode first** - Start with queries, then move to mutations
3. **Test in development** - Never test MCP operations against production data
4. **Review generated code** - AI-generated code should be reviewed before committing

## References

For detailed MCP server documentation, implementation guides, and advanced configurations, refer to official documentation:
- [Anthropic MCP Documentation](https://docs.anthropic.com)
- [Context7 Documentation](https://context7.com)
- [Supabase MCP Guide](https://supabase.com/docs)