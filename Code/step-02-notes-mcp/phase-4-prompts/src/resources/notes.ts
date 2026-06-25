// Note resources for MCP server

import type { DatabaseSync } from 'node:sqlite';
import { getAllNotes, getRecentNotes, getNotesByTag, searchNotes } from '../database.js';

// Static resources - always available
export const noteResources = [
  {
    uri: 'notes://recent',
    name: 'Recent Notes',
    description: 'The 5 most recent notes',
    mimeType: 'application/json',
  },
  {
    uri: 'notes://all',
    name: 'All Notes',
    description: 'All notes in the database',
    mimeType: 'application/json',
  },
];

// Template resources - parameterized
export const noteResourceTemplates = [
  {
    uriTemplate: 'notes://tags/{tag}',
    name: 'Notes by Tag',
    description: 'Notes filtered by a specific tag',
    mimeType: 'application/json',
  },
  {
    uriTemplate: 'notes://search/{query}',
    name: 'Search Notes',
    description: 'Search notes by keyword',
    mimeType: 'application/json',
  },
];

// Read a note resource by URI
export function readNoteResource(db: DatabaseSync, uri: string) {
  // Static resources
  if (uri === 'notes://recent') {
    const notes = getRecentNotes(db, 5);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(notes, null, 2),
      }],
    };
  }

  if (uri === 'notes://all') {
    const notes = getAllNotes(db);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(notes, null, 2),
      }],
    };
  }

  // Template resources
  const tagsMatch = uri.match(/^notes:\/\/tags\/(.+)$/);
  if (tagsMatch) {
    const tag = decodeURIComponent(tagsMatch[1]);
    const notes = getNotesByTag(db, tag);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(notes, null, 2),
      }],
    };
  }

  const searchMatch = uri.match(/^notes:\/\/search\/(.+)$/);
  if (searchMatch) {
    const query = decodeURIComponent(searchMatch[1]);
    const notes = searchNotes(db, query);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(notes, null, 2),
      }],
    };
  }

  throw new Error(`Unknown note resource URI: ${uri}`);
}
