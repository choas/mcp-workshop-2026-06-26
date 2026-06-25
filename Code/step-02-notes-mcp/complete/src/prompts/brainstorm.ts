// Brainstorm ideas prompt implementation
// Per MCP_IMPLEMENTATION_CONCEPT.md prompts/brainstorm.ts section

import type { DatabaseSync } from 'node:sqlite';
import { searchNotes, type Note } from '../database.js';

export const brainstormPrompt = {
  name: 'brainstorm_ideas',
  description: 'Start a structured brainstorming session on a topic',
  arguments: [
    {
      name: 'topic',
      description: 'The topic to brainstorm about',
      required: true
    }
  ]
};

function formatNote(note: Note): string {
  const tags = note.tags ? ` [${note.tags}]` : '';
  return `- ${note.content}${tags}`;
}

export async function getBrainstormPrompt(
  db: DatabaseSync,
  args: { topic: string }
): Promise<{ role: string; content: { type: string; text: string } }> {
  const topic = args.topic;

  // Search for relevant existing notes on the topic
  const relevantNotes = searchNotes(db, topic);
  const notesSection = relevantNotes.length > 0
    ? `**Existing notes related to "${topic}":**\n${relevantNotes.map(formatNote).join('\n')}`
    : `No existing notes found related to "${topic}".`;

  const promptText = `Let's brainstorm ideas about: **${topic}**

${notesSection}

Please help me brainstorm by:

1. **Building on Existing Ideas**: If there are related notes above, expand on them and find connections
2. **Generating New Ideas**: Suggest 5-10 creative ideas related to this topic
3. **Categorizing**: Group the ideas into logical categories
4. **Prioritizing**: Highlight the most promising or actionable ideas
5. **Next Steps**: Suggest concrete next steps to develop the top ideas

Feel free to ask clarifying questions if you need more context about the topic or my goals.`;

  return {
    role: 'user',
    content: {
      type: 'text',
      text: promptText
    }
  };
}
