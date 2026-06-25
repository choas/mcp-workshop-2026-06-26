// Phase 1: MCP Server Scaffold
// This is the minimal MCP server - it connects but has no tools yet

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Initialize MCP Server with basic info
const server = new Server(
  {
    name: 'notes-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      // We advertise the tools capability but don't register any tools yet.
      // Phase 2 fills this in. Because we declare the capability, we must also
      // answer tools/list - otherwise clients get "Method not found".
      tools: {},
    },
  }
);

// Respond to tools/list with an empty list. Clients (and MCP Inspector) will
// show "no tools" instead of erroring with MCP error -32601 (Method not found).
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [],
}));

// Connect via stdio transport (used by MCP clients)
const transport = new StdioServerTransport();
await server.connect(transport);

// Log to stderr (stdout is reserved for MCP protocol)
console.error('Notes MCP server running (Phase 1: scaffold only)');
