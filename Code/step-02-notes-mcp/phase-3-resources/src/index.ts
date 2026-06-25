// Phase 3: MCP Server with Tools + Resources
// Resources let LLMs read data directly (without calling tools)

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { initDatabase } from './database.js';
import {
  noteToolDefinitions,
  handleListNotes,
  handleAddNote,
  handleSearchNotes,
  handleDeleteNote,
} from './tools/notes.js';
import {
  noteResources,
  noteResourceTemplates,
  readNoteResource,
} from './resources/notes.js';

// Initialize database
const db = initDatabase();

// Initialize MCP Server - now with resources capability!
const server = new Server(
  {
    name: 'notes-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},  // NEW: Enable resources
    },
  }
);

// === TOOLS (same as Phase 2) ===

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: noteToolDefinitions };
});

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

// === RESOURCES (NEW in Phase 3) ===

// List static resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: noteResources };
});

// List resource templates
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return { resourceTemplates: noteResourceTemplates };
});

// Read a specific resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  return readNoteResource(db, uri);
});

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Notes MCP server running (Phase 3: tools + resources)');
