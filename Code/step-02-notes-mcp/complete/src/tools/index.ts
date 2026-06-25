// Tool registration for MCP server
// Per MCP_IMPLEMENTATION_CONCEPT.md tools/index.ts section

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { DatabaseSync } from 'node:sqlite';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  noteToolDefinitions,
  handleAddNote,
  handleSearchNotes,
  handleListNotes,
  handleDeleteNote,
} from './notes.js';

import { quoteToolDefinition, handleGetQuote } from './quotes.js';

// Combine all tool definitions
const allTools = [
  ...noteToolDefinitions,
  quoteToolDefinition,
];

export function registerTools(server: Server, db: DatabaseSync): void {
  // Handle tools/list request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  // Handle tools/call request
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    switch (name) {
      case 'add_note':
        return handleAddNote(db, args as { content?: string; tags?: string[] });

      case 'search_notes':
        return handleSearchNotes(db, args as { query?: string });

      case 'list_notes':
        return handleListNotes(db, args as { limit?: number });

      case 'delete_note':
        return handleDeleteNote(db, args as { id?: number });

      case 'get_quote':
        return await handleGetQuote();

      default:
        return {
          content: [{ type: 'text', text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  });
}
