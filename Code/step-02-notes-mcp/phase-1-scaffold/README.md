# Phase 1: MCP Server Scaffold

## Goal
Create an empty MCP server that connects but has no functionality yet.

## Vibe Coding Prompt

> "Create an MCP server using @modelcontextprotocol/sdk with stdio transport.
> Just the basic setup with server name 'notes-mcp', no tools yet.
> Use TypeScript with ES modules."

## Test with MCP Inspector

```bash
npm install
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

You should see:
- Server connects successfully
- Tools list is empty
- No errors

## Next Step
Move to phase-2-tools to add your first tool!
