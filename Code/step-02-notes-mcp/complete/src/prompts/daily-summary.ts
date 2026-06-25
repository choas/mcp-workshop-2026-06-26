// Daily summary prompt implementation
// Per MCP_IMPLEMENTATION_CONCEPT.md prompts/daily-summary.ts section

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { DatabaseSync } from 'node:sqlite';
import { getRecentNotes, type Note } from '../database.js';
import { getRandomQuote } from '../external-apis.js';

export const dailySummaryPrompt = {
  name: 'daily_summary',
  description: 'Generate a summary of today\'s notes with an inspiring quote',
  arguments: []
};

function formatNote(note: Note): string {
  const tags = note.tags ? ` [${note.tags}]` : '';
  return `- ${note.content}${tags}`;
}

export async function getDailySummaryPrompt(
  db: DatabaseSync
): Promise<{ role: string; content: { type: string; text: string } }> {
  // Fetch recent notes
  const recentNotes = getRecentNotes(db, 5);
  const notesSection = recentNotes.length > 0
    ? recentNotes.map(formatNote).join('\n')
    : 'No recent notes found.';

  // Get a random quote
  const quote = await getRandomQuote();
  const quoteSection = `\n\n**Quote of the Day:**\n"${quote.content}" — ${quote.author}`;

  const promptText = `Please create a cohesive daily summary based on the following information:

**Recent Notes:**
${notesSection}${quoteSection}

Based on this information, please:
1. Summarize the key themes and topics from the notes
2. Highlight any action items or important reminders
3. Provide a brief, motivational wrap-up incorporating the quote

Keep the summary concise but informative.`;

  return {
    role: 'user',
    content: {
      type: 'text',
      text: promptText
    }
  };
}
