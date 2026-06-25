// Note CRUD tools for MCP server
// Per MCP_IMPLEMENTATION_CONCEPT.md tools/notes.ts section

import type { DatabaseSync } from 'node:sqlite';
import { addNote, searchNotes, listNotes, deleteNote, type Note } from '../database.js';

// Tool definitions for notes
export const noteToolDefinitions = [
  {
    name: "add_note",
    description: "Create a new note with optional tags",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The note content"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags for categorization"
        }
      },
      required: ["content"]
    }
  },
  {
    name: "search_notes",
    description: "Search notes by keyword in content",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword"
        }
      },
      required: ["query"]
    }
  },
  {
    name: "list_notes",
    description: "List recent notes",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of notes to return (default: 10)"
        }
      }
    }
  },
  {
    name: "delete_note",
    description: "Delete a note by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "number",
          description: "The note ID to delete"
        }
      },
      required: ["id"]
    }
  }
];

// Format note for display
function formatNote(note: Note): string {
  const tags = note.tags ? `[${note.tags}]` : '';
  return `ID: ${note.id} ${tags}\n${note.content}\nCreated: ${note.created_at}`;
}

// Tool handlers for notes
export function handleAddNote(
  db: DatabaseSync,
  args: { content?: string; tags?: string[] }
): { content: Array<{ type: string; text: string }>; isError?: boolean } {
  if (!args.content || typeof args.content !== 'string') {
    return {
      content: [{ type: "text", text: "Error: content is required and must be a string" }],
      isError: true
    };
  }

  try {
    const note = addNote(db, args.content, args.tags);
    return {
      content: [{ type: "text", text: `Note created successfully:\n${formatNote(note)}` }]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: "text", text: `DatabaseSync error: ${message}` }],
      isError: true
    };
  }
}

export function handleSearchNotes(
  db: DatabaseSync,
  args: { query?: string }
): { content: Array<{ type: string; text: string }>; isError?: boolean } {
  if (!args.query || typeof args.query !== 'string') {
    return {
      content: [{ type: "text", text: "Error: query is required and must be a string" }],
      isError: true
    };
  }

  try {
    const notes = searchNotes(db, args.query);
    if (notes.length === 0) {
      return {
        content: [{ type: "text", text: `No notes found matching "${args.query}"` }]
      };
    }
    const formatted = notes.map(formatNote).join('\n\n---\n\n');
    return {
      content: [{ type: "text", text: `Found ${notes.length} note(s):\n\n${formatted}` }]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: "text", text: `DatabaseSync error: ${message}` }],
      isError: true
    };
  }
}

export function handleListNotes(
  db: DatabaseSync,
  args: { limit?: number }
): { content: Array<{ type: string; text: string }>; isError?: boolean } {
  const limit = typeof args.limit === 'number' ? args.limit : 10;

  try {
    const notes = listNotes(db, limit);
    if (notes.length === 0) {
      return {
        content: [{ type: "text", text: "No notes found" }]
      };
    }
    const formatted = notes.map(formatNote).join('\n\n---\n\n');
    return {
      content: [{ type: "text", text: `Showing ${notes.length} note(s):\n\n${formatted}` }]
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: "text", text: `DatabaseSync error: ${message}` }],
      isError: true
    };
  }
}

export function handleDeleteNote(
  db: DatabaseSync,
  args: { id?: number | string }
): { content: Array<{ type: string; text: string }>; isError?: boolean } {
  // Accept both number and string, parse string to number
  const id = typeof args.id === 'string' ? parseInt(args.id, 10) : args.id;
  if (typeof id !== 'number' || isNaN(id)) {
    return {
      content: [{ type: "text", text: "Error: id is required and must be a number" }],
      isError: true
    };
  }

  try {
    const deleted = deleteNote(db, id);
    if (deleted) {
      return {
        content: [{ type: "text", text: `Note ${id} deleted successfully` }]
      };
    } else {
      return {
        content: [{ type: "text", text: `Note ${id} not found` }],
        isError: true
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: "text", text: `DatabaseSync error: ${message}` }],
      isError: true
    };
  }
}
