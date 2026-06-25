# Phase 3: Adding Resources

## Goal
Add resources so the LLM can read data directly without calling tools.

## Tools vs Resources

| Tools | Resources |
|-------|-----------|
| Actions (create, delete) | Read-only data |
| LLM must call explicitly | LLM can read anytime |
| Returns result of action | Returns data |

## Vibe Coding Prompts

### Step 1: Add static resources
> "Add MCP resources for 'notes://recent' and 'notes://all'.
> Use ListResourcesRequestSchema and ReadResourceRequestSchema.
> Return notes as JSON."

### Step 2: Add resource templates
> "Add resource templates for 'notes://tags/{tag}' and 'notes://search/{query}'.
> Templates allow parameterized URIs.
> Use ListResourceTemplatesRequestSchema."

## Prerequisites

This MCP server shares the database with step-01-notes-app.
Add notes via the WebUI first if you haven't already.

## Test with MCP Inspector

```bash
npm install
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

Check:
1. Resources tab shows notes://recent and notes://all
2. Resource Templates tab shows the templates
3. Click on a resource to read its contents
4. Try notes://tags/test with some tagged notes

## Next Step
Move to phase-4-prompts to add reusable prompt templates!
