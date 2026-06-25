// Organize notes prompt

import type { DatabaseSync } from 'node:sqlite';
import { getAllNotes, getNotesByTag, type Note } from '../database.js';

export const organizePrompt = {
  name: 'organize_notes',
  description: 'Suggest organization improvements for notes',
  arguments: [
    {
      name: 'tag',
      description: 'Optional tag to focus on specific notes',
      required: false
    }
  ]
};

function formatNote(note: Note): string {
  const tags = note.tags ? ` [${note.tags}]` : ' [untagged]';
  return `- ID ${note.id}: ${note.content}${tags}`;
}

export async function getOrganizePrompt(
  db: DatabaseSync,
  args: { tag?: string }
): Promise<{ role: string; content: { type: string; text: string } }> {
  const notes = args.tag ? getNotesByTag(db, args.tag) : getAllNotes(db);

  const notesSection = notes.length > 0
    ? notes.map(formatNote).join('\n')
    : 'No notes found.';

  const focusText = args.tag
    ? `focusing on notes tagged with "${args.tag}"`
    : 'across all notes';

  const promptText = `Please analyze my notes and suggest organization improvements ${focusText}:

**Current Notes:**
${notesSection}

Please suggest:
1. **Better Tags**: Recommend new or improved tags for untagged/poorly-tagged notes
2. **Groupings**: Identify logical groups or themes among the notes
3. **Duplicates**: Flag any notes that seem redundant or could be merged
4. **Gaps**: Suggest topics that seem to be missing based on the patterns
5. **Archive Candidates**: Identify notes that might be outdated or less relevant

Provide specific suggestions using the note IDs.`;

  return {
    role: 'user',
    content: { type: 'text', text: promptText }
  };
}
