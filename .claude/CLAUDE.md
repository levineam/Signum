# MCP Server Usage Guide

This document explains how and when to use the available MCP (Model Context Protocol) servers in your development workflow.

## 1. Vercel CLI

### When to Use
- **Deployments**: When you need to deploy applications to Vercel's platform
- **Preview Environments**: Creating preview deployments for feature branches and pull requests
- **CI/CD Integration**: Automating deployments in your GitHub Actions or other CI/CD pipelines
- **Custom Workflows**: When you need full control over your deployment pipeline vs. Git-based auto-deployments

### How to Use
**Authentication & Setup:**
```bash
npm install -g vercel
vercel login
```

**Best Practices for 2025:**
- Use **enterprise-grade pipeline approach** with GitHub Actions + Vercel CLI for quality control
- Deploy to **Pre-Production first** (staging/preview), then Production
- Use environment variables: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` in CI/CD
- Take advantage of **automatic Preview Deployments** for every branch/PR
- Build locally with `vercel build` then deploy with `vercel deploy --prebuilt` for maximum control

**Deployment Commands:**
```bash
vercel deploy                    # Deploy to preview
vercel deploy --prod            # Deploy to production
vercel build                    # Build locally
vercel deploy --prebuilt       # Deploy build artifacts only
```

**Recommended Workflow:**
1. Deploy changes to Preview environment first
2. Run tests and quality checks
3. Assign production domains only when ready
4. Keep manual approval enabled for production deployments

## 2. Supabase MCP

### When to Use
- **Database Operations**: Creating tables, running migrations, executing SQL queries
- **Project Management**: Creating projects, managing branches, handling deployments
- **Development Assistance**: Getting schema information, generating TypeScript types
- **Security Analysis**: Running advisory checks for security and performance issues
- **Edge Functions**: Deploying and managing serverless functions

### How to Use
**Setup Requirements:**
1. Create a Personal Access Token at [Supabase settings](https://supabase.com/dashboard/account/tokens)
2. Configure MCP server in your AI tool (already configured in Claude Code)

**Available Capabilities:**
- **Project Management**: List/create/pause/restore projects, manage branches
- **Database Operations**: Execute SQL, apply migrations, list tables/extensions
- **Security**: Get security and performance advisors
- **Development**: Generate TypeScript types, manage Edge Functions
- **Monitoring**: Get logs and project status

**Best Practices:**
- **Use Read-Only Mode** by default to prevent unintended changes
- **Never connect to production** - use development projects or branches
- **Use Project Scoping** to limit access to specific projects
- **Leverage Branching** for safe testing of schema changes
- **Review all SQL queries** before execution due to prompt injection risks
- **Enable manual approval** for all tool calls in your MCP client

**Security Recommendations:**
- Use development environments with non-production data
- Don't give MCP access to customers/end users
- Use Supabase's branching feature for safe testing
- Enable only necessary feature groups to reduce attack surface

## 3. Playwright MCP

### When to Use
- **E2E Testing**: Generating and running end-to-end tests for web applications
- **UI Automation**: Automating browser interactions and form submissions
- **Test Debugging**: Exploring web pages and writing test scenarios
- **Quality Assurance**: Creating reliable, maintainable automated test suites
- **AI-Generated Testing**: Using natural language to describe test scenarios

### How to Use
**Core Capabilities:**
- Browser automation (Chrome, Firefox, Safari, Edge)
- Accessibility-tree based interactions (no screenshots needed)
- Test generation from natural language descriptions
- Form filling, navigation, and user interaction simulation
- Network request monitoring and API testing integration

**2025 Best Practices:**
- **Progressive Implementation**: Start with simple navigation tests, gradually add advanced features
- **Effective Prompting**: Use clear, specific prompts broken into steps
  ```
  "Fetch test case first, then generate Playwright script"
  ```
- **Quality Standards**: Use TypeScript tests with `@playwright/test`, role-based locators, and auto-retrying assertions
- **No Manual Timeouts**: Leverage Playwright's built-in retries and auto-waiting
- **Connection Management**: Use connection pooling for multiple clients
- **Resource Monitoring**: Track memory/CPU usage to avoid system overload

**Configuration Options:**
- Headless vs headed mode
- Device emulation
- Storage state management
- Security configurations with allowed/blocked origins

**Enterprise Integration:**
- BDD framework compatibility
- Cloud-based execution grids
- Modern reporting tools
- CI/CD pipeline integration

## 4. shadcn/ui MCP

### When to Use
- **Component Development**: Adding shadcn/ui components to your React projects
- **UI Design System**: Implementing consistent design patterns
- **Rapid Prototyping**: Quickly building interfaces with pre-built components
- **Component Discovery**: Finding and understanding available shadcn/ui components

### How to Use
**Available Components:** The MCP server provides access to 200+ components including:
- Layout: navbar variations, containers, grids
- Forms: inputs, selectors, validation components
- Data Display: tables, charts, cards, badges
- Feedback: alerts, modals, tooltips
- Navigation: menus, breadcrumbs, pagination
- Utilities: hooks, animations, backgrounds

**2025 Official Recommendations:**
- **Zero-Config MCP Support**: Use `npx shadcn registry:mcp` for automatic MCP compatibility
- **Clear Descriptions**: Add concise, informative descriptions for AI assistants
- **Proper Dependencies**: List all dependencies accurately for automatic installation
- **Registry Dependencies**: Use `registryDependencies` to indicate component relationships
- **Consistent Naming**: Use kebab-case for component names

**Best Practices:**
- **Update Regularly**: Keep server updated to access latest components
- **Proper Configuration**: Configure SSE endpoint for optimal performance
- **Use MCP Inspector**: For debugging and troubleshooting
- **Context-Aware Components**: The server provides real context so components work as intended
- **Semantic Versioning**: Use semantic versioning for releases and maintain changelogs

**Quality Benefits:**
- Fixes AI-generated UI issues by providing real component context
- Components actually work and look as designed
- 2x higher developer adoption rates vs undocumented servers
- Reduces deployment-related support tickets by 60%

## 5. Context7 MCP

### When to Use
- **Library Documentation**: Get up-to-date, version-specific documentation for any library or framework
- **Code Generation**: Generate accurate code examples using current library APIs and patterns
- **API References**: Access real-time documentation without leaving your development environment
- **Version-Specific Help**: Get documentation for exact versions of libraries you're using
- **Reducing Hallucinations**: Eliminate outdated information by accessing current documentation sources

### How to Use
**Setup Requirements:**
1. Get an API key from [Context7 website](https://context7.com) (free tier available)
2. Configure the MCP server in your AI tool

**Activation Trigger:**
- Add `use context7` to any prompt to automatically fetch relevant documentation
- Context7 will resolve library names and fetch current docs for your specific use case

**Core Capabilities:**
- **Real-Time Documentation**: Pulls latest docs directly from official sources
- **Version-Specific Content**: Access documentation for exact library versions
- **Universal Compatibility**: Works with any MCP-compatible client (Claude Desktop, Cursor, VS Code, etc.)
- **Smart Resolution**: Automatically resolves library names to correct documentation sources
- **Code Examples**: Provides working code snippets that match current API patterns

### 2025 Best Practices

**Integration Workflow:**
- **Always Use for Code Generation**: Automatically trigger Context7 for any coding task
- **Version Specification**: Include specific version numbers when available for precise documentation
- **Library Resolution**: Let Context7 resolve ambiguous library names rather than guessing
- **Trust Verification**: Prefer libraries with higher trust scores (7-10) for authoritative information

**Configuration Examples:**
```json
// Claude Desktop Configuration
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
    }
  }
}

// Cursor Configuration (~/.cursor/mcp.json)
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
    }
  }
}

// VS Code Configuration
{
  "mcp": {
    "servers": {
      "context7": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
      }
    }
  }
}
```

**Auto-Invocation Rules:**
Add this rule to your MCP client for automatic Context7 usage:
```
Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.
```

**Remote vs Local Configuration:**
- **Remote (Recommended)**: Faster, no local dependencies, always up-to-date
- **Local**: Better for high-frequency usage, works offline after initial setup

### Installation Methods

**Smithery CLI (Easiest for Claude Desktop):**
```bash
npx -y @smithery/cli install @upstash/context7-mcp --client claude
```

**Manual Configuration for Multiple Clients:**
- **Windows Users**: Use `cmd` wrapper for better compatibility
- **Docker Users**: Available as containerized solution for enterprise deployments
- **Bun Users**: Use `bunx` instead of `npx` to resolve module issues

**Troubleshooting:**
- **ERR_MODULE_NOT_FOUND**: Switch from `npx` to `bunx` in configuration
- **Timeout Issues on Windows**: Use full Node.js paths or increase startup timeout
- **Permission Issues**: Ensure Node.js v18+ is installed and accessible

### Usage Examples

**Basic Usage:**
```
"How do I set up authentication in Next.js 14? use context7"
```

**Version-Specific Query:**
```
"Show me React 18 useEffect patterns use context7"
```

**Library Resolution:**
```
"Help me implement database queries with Prisma use context7"
```

### Quality Assurance Features

**Documentation Accuracy:**
- **Source Verification**: Pulls from official repositories and documentation sites
- **Version Matching**: Ensures examples match your specified library versions
- **Trust Scoring**: Libraries rated 7-10 provide most authoritative information
- **Real-Time Updates**: Documentation stays current with latest releases

**Performance Optimizations:**
- **Smart Caching**: Frequently accessed docs cached for faster responses
- **Selective Content**: Only relevant documentation sections included in context
- **Token Management**: Optimized to provide maximum information within token limits

### Security Considerations
- **API Key Management**: Store API keys securely, never commit to repositories
- **Rate Limiting**: Respect Context7 API rate limits for sustained usage
- **Content Trust**: While Context7 sources are vetted, always review generated code
- **Network Dependencies**: Remote configuration requires internet connectivity

## General MCP Best Practices

### Security
- **Scan Dependencies**: Use tools like Snyk for vulnerability detection
- **Review Tool Calls**: Always manually approve tool calls before execution
- **Limit Permissions**: Use read-only modes and project scoping where possible

### Testing & Development
- **Start Local**: Begin with fast local tests, then progress to network-based tests
- **Use Specialized Tools**: Leverage MCP Inspector for testing and debugging
- **Docker Deployment**: Package servers as containers for consistency

### Documentation & Maintenance
- **Semantic Versioning**: Use semantic versioning for all MCP server releases
- **Maintain Changelogs**: Document changes for easier upgrades and rollbacks
- **Comprehensive Documentation**: Provide clear API references and examples

### Performance Optimization
- **Tool Design**: Group related tasks instead of creating tools for every API endpoint
- **Resource Management**: Monitor and optimize server resource usage
- **Connection Pooling**: Implement connection pooling for multiple client scenarios