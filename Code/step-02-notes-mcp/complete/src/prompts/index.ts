// Prompt registration for MCP server
// Per MCP_IMPLEMENTATION_CONCEPT.md prompts/index.ts section

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { DatabaseSync } from 'node:sqlite';

import { dailySummaryPrompt, getDailySummaryPrompt } from './daily-summary.js';
import { brainstormPrompt, getBrainstormPrompt } from './brainstorm.js';
import { organizePrompt, getOrganizePrompt } from './organize.js';

// All available prompts
const prompts = [
  dailySummaryPrompt,
  brainstormPrompt,
  organizePrompt,
];

export function registerPrompts(server: Server, db: DatabaseSync): void {
  // Handle prompts/list request
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: prompts.map(p => ({
        name: p.name,
        description: p.description,
        arguments: p.arguments,
      })),
    };
  });

  // Handle prompts/get request
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'daily_summary': {
        const message = await getDailySummaryPrompt(db);
        return {
          description: dailySummaryPrompt.description,
          messages: [message],
        };
      }

      case 'brainstorm_ideas': {
        const topic = args?.topic as string;
        if (!topic) {
          throw new Error('Topic argument is required for brainstorm_ideas prompt');
        }
        const message = await getBrainstormPrompt(db, { topic });
        return {
          description: brainstormPrompt.description,
          messages: [message],
        };
      }

      case 'organize_notes': {
        const message = await getOrganizePrompt(db, {
          tag: args?.tag as string | undefined,
        });
        return {
          description: organizePrompt.description,
          messages: [message],
        };
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });
}
