// Organize notes prompt implementation
// Per MCP_IMPLEMENTATION_CONCEPT.md prompts/organize.ts section

import type { DatabaseSync } from 'node:sqlite';
import { getAllNotes, getNotesByTag, type Note } from '../database.js';

export const organizePrompt = {
  name: 'organize_notes',
  description: 'Analyze notes and suggest better organization',
  arguments: [
    {
      name: 'tag',
      description: 'Optional tag to focus on',
      required: false
    }
  ]
};

function formatNoteDetailed(note: Note): string {
  const tags = note.tags ? `Tags: [${note.tags}]` : 'Tags: (none)';
  return `- ID: ${note.id}\n  Content: ${note.content}\n  ${tags}\n  Created: ${note.created_at}`;
}

export async function getOrganizePrompt(
  db: DatabaseSync,
  args: { tag?: string }
): Promise<{ role: string; content: { type: string; text: string } }> {
  // Fetch notes (all or filtered by tag)
  const notes = args.tag
    ? getNotesByTag(db, args.tag)
    : getAllNotes(db);

  const contextText = args.tag
    ? `notes tagged with "${args.tag}"`
    : 'all notes';

  if (notes.length === 0) {
    const promptText = args.tag
      ? `No notes found with tag "${args.tag}". Please add some notes first using the add_note tool.`
      : 'No notes found in the database. Please add some notes first using the add_note tool.';

    return {
      role: 'user',
      content: {
        type: 'text',
        text: promptText
      }
    };
  }

  const notesSection = notes.map(formatNoteDetailed).join('\n\n');

  // Extract existing tags for analysis
  const existingTags = new Set<string>();
  notes.forEach(note => {
    if (note.tags) {
      note.tags.split(',').forEach(tag => existingTags.add(tag.trim()));
    }
  });
  const tagsListText = existingTags.size > 0
    ? `Current tags in use: ${Array.from(existingTags).join(', ')}`
    : 'No tags currently in use.';

  const promptText = `Please analyze ${contextText} and suggest better organization.

**Notes to Analyze (${notes.length} total):**

${notesSection}

**${tagsListText}**

Please analyze these notes and provide:

1. **Tagging Suggestions**:
   - Which notes could benefit from additional tags?
   - Are there any suggested new tags that would help organization?
   - Are any existing tags redundant or could be consolidated?

2. **Grouping Analysis**:
   - What themes or topics emerge from these notes?
   - Which notes are related and could be grouped together?
   - Suggest logical groupings with proposed group names

3. **Content Analysis**:
   - Are there any duplicate or near-duplicate notes?
   - Are any notes incomplete or could be expanded?
   - Are there gaps - topics mentioned but not fully developed?

4. **Action Items**:
   - List specific changes to make (e.g., "Add tag 'project' to note ID 3")
   - Prioritize the most impactful organizational improvements

Please be specific with note IDs when making suggestions.`;

  return {
    role: 'user',
    content: {
      type: 'text',
      text: promptText
    }
  };
}
