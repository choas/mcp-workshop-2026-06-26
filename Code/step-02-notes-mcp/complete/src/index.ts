// MCP Server entry point
// Per MCP_IMPLEMENTATION_CONCEPT.md index.ts section

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { initDatabase } from './database.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

// Initialize MCP Server
const server = new Server(
  {
    name: 'personal-knowledge-assistant',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Initialize database
const db = initDatabase();

// Register all tools
registerTools(server, db);

// Register all resources
registerResources(server, db);

// Register all prompts
registerPrompts(server, db);

// Connect stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
