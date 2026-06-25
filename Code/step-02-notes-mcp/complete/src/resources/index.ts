// Resource registration for MCP server
// Per MCP_IMPLEMENTATION_CONCEPT.md resources/index.ts section

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { DatabaseSync } from 'node:sqlite';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { noteResources, noteResourceTemplates, readNoteResource } from './notes.js';
import { quoteResources, readQuoteResource } from './quotes.js';

// Combine all static resources
const allResources = [
  ...noteResources,
  ...quoteResources,
];

// Combine all resource templates
const allResourceTemplates = [
  ...noteResourceTemplates,
];

export function registerResources(server: Server, db: DatabaseSync): void {
  // Handle resources/list request - returns static resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return { resources: allResources };
  });

  // Handle resources/templates/list request - returns resource templates
  server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
    return { resourceTemplates: allResourceTemplates };
  });

  // Handle resources/read request
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    // Route to appropriate handler based on URI scheme
    if (uri.startsWith('notes://')) {
      return readNoteResource(db, uri);
    }

    if (uri.startsWith('quotes://')) {
      return await readQuoteResource(uri);
    }

    throw new Error(`Unknown resource URI scheme: ${uri}`);
  });
}
