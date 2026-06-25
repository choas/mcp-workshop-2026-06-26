// Daily summary prompt

import type { DatabaseSync } from 'node:sqlite';
import { getRecentNotes, type Note } from '../database.js';

export const dailySummaryPrompt = {
  name: 'daily_summary',
  description: 'Generate a summary of recent notes',
  arguments: []  // No arguments needed
};

function formatNote(note: Note): string {
  const tags = note.tags ? ` [${note.tags}]` : '';
  return `- ${note.content}${tags}`;
}

export async function getDailySummaryPrompt(
  db: DatabaseSync
): Promise<{ role: string; content: { type: string; text: string } }> {
  const recentNotes = getRecentNotes(db, 10);
  const notesSection = recentNotes.length > 0
    ? recentNotes.map(formatNote).join('\n')
    : 'No recent notes found.';

  const promptText = `Please create a daily summary based on these recent notes:

**Recent Notes:**
${notesSection}

Please:
1. Summarize the key themes and topics
2. Highlight any action items or reminders
3. Suggest connections between related notes
4. Provide a brief motivational wrap-up

Keep the summary concise but informative.`;

  return {
    role: 'user',
    content: { type: 'text', text: promptText }
  };
}
