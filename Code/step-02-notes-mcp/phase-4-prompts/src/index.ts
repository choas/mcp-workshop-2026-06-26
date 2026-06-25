// Phase 4: MCP Server with Tools + Resources + Prompts
// Prompts are reusable templates for common LLM interactions

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
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
import { dailySummaryPrompt, getDailySummaryPrompt } from './prompts/daily-summary.js';
import { brainstormPrompt, getBrainstormPrompt } from './prompts/brainstorm.js';
import { organizePrompt, getOrganizePrompt } from './prompts/organize.js';

// Initialize database
const db = initDatabase();

// All prompts
const prompts = [dailySummaryPrompt, brainstormPrompt, organizePrompt];

// Initialize MCP Server - now with all three capabilities!
const server = new Server(
  {
    name: 'notes-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},  // NEW: Enable prompts
    },
  }
);

// === TOOLS ===

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

// === RESOURCES ===

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: noteResources };
});

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return { resourceTemplates: noteResourceTemplates };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  return readNoteResource(db, uri);
});

// === PROMPTS (NEW in Phase 4) ===

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: prompts.map(p => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    })),
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'daily_summary': {
      const message = await getDailySummaryPrompt(db);
      return { description: dailySummaryPrompt.description, messages: [message] };
    }
    case 'brainstorm_ideas': {
      const topic = args?.topic as string;
      if (!topic) throw new Error('Topic argument is required');
      const message = await getBrainstormPrompt(db, { topic });
      return { description: brainstormPrompt.description, messages: [message] };
    }
    case 'organize_notes': {
      const message = await getOrganizePrompt(db, { tag: args?.tag as string | undefined });
      return { description: organizePrompt.description, messages: [message] };
    }
    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Notes MCP server running (Phase 4: complete with tools, resources, prompts)');
