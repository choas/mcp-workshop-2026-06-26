// Phase 2: MCP Server with Tools
// Now we add database and note management tools

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { initDatabase } from './database.js';
import {
  noteToolDefinitions,
  handleListNotes,
  handleAddNote,
  handleSearchNotes,
  handleDeleteNote,
} from './tools/notes.js';

// Initialize database
const db = initDatabase();

// Initialize MCP Server
const server = new Server(
  {
    name: 'notes-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},  // We now have tools!
    },
  }
);

// Handle tools/list - return our tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: noteToolDefinitions };
});

// Handle tools/call - execute the requested tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  switch (name) {
    case 'list_notes':
      return handleListNotes(db, args as { limit?: number });
    case 'add_note':
      return handleAddNote(db, args as { content?: string; tags?: string[] });
    case 'search_notes':
      return handleSearchNotes(db, args as { query?: string });
    case 'delete_note':
      return handleDeleteNote(db, args as { id?: number });
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
});

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Notes MCP server running (Phase 2: with tools)');
