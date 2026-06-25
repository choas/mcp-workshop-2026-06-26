// Note tools for MCP server

import type { DatabaseSync } from 'node:sqlite';
import { addNote, searchNotes, listNotes, deleteNote, type Note } from '../database.js';

// Tool definitions
export const noteToolDefinitions = [
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

// Tool handlers
export function handleListNotes(db: DatabaseSync, args: { limit?: number }) {
  const limit = typeof args.limit === 'number' ? args.limit : 10;
  const notes = listNotes(db, limit);

  if (notes.length === 0) {
    return { content: [{ type: "text", text: "No notes found" }] };
  }

  const formatted = notes.map(formatNote).join('\n\n---\n\n');
  return { content: [{ type: "text", text: `Showing ${notes.length} note(s):\n\n${formatted}` }] };
}

export function handleAddNote(db: DatabaseSync, args: { content?: string; tags?: string[] }) {
  if (!args.content) {
    return { content: [{ type: "text", text: "Error: content is required" }], isError: true };
  }

  const note = addNote(db, args.content, args.tags);
  return { content: [{ type: "text", text: `Note created:\n${formatNote(note)}` }] };
}

export function handleSearchNotes(db: DatabaseSync, args: { query?: string }) {
  if (!args.query) {
    return { content: [{ type: "text", text: "Error: query is required" }], isError: true };
  }

  const notes = searchNotes(db, args.query);
  if (notes.length === 0) {
    return { content: [{ type: "text", text: `No notes found matching "${args.query}"` }] };
  }

  const formatted = notes.map(formatNote).join('\n\n---\n\n');
  return { content: [{ type: "text", text: `Found ${notes.length} note(s):\n\n${formatted}` }] };
}

export function handleDeleteNote(db: DatabaseSync, args: { id?: number | string }) {
  const id = typeof args.id === 'string' ? parseInt(args.id, 10) : args.id;
  if (typeof id !== 'number' || isNaN(id)) {
    return { content: [{ type: "text", text: "Error: id is required" }], isError: true };
  }

  const deleted = deleteNote(db, id);
  if (deleted) {
    return { content: [{ type: "text", text: `Note ${id} deleted successfully` }] };
  }
  return { content: [{ type: "text", text: `Note ${id} not found` }], isError: true };
}
