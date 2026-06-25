import http, { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase, addNote, searchNotes, listNotes, deleteNote, getNotesByTag, Note } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Defaults to 3001, but `PORT=3003 npm run dev` overrides it (see TROUBLESHOOTING.md).
const PORT = Number(process.env.PORT) || 3001;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Initialize database
const db = initDatabase();

// Helper to parse tags into an array for the response
function formatNote(note: Note): object {
  return {
    id: note.id,
    content: note.content,
    tags: note.tags ? note.tags.split(',') : [],
    created_at: note.created_at,
    updated_at: note.updated_at,
  };
}

// Send a JSON response (replaces express's res.json)
function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}

// Read and JSON-parse the request body (replaces express.json() middleware)
function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      // Guard against excessively large bodies
      if (raw.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Serve static files from public/ (replaces express.static)
function serveStatic(res: ServerResponse, pathname: string): void {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, relativePath);

  // Prevent path traversal outside the public directory
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }
    const contentType = CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  // Decoded, non-empty path segments, e.g. /notes/tags/work -> ['notes', 'tags', 'work']
  const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);

  // POST /notes - Create a new note
  if (method === 'POST' && segments.length === 1 && segments[0] === 'notes') {
    const body = (await readJsonBody(req)) as { content?: unknown; tags?: unknown };
    const { content, tags } = body;

    if (!content || typeof content !== 'string') {
      sendJson(res, 400, { error: 'content is required and must be a string' });
      return;
    }
    if (tags !== undefined && !Array.isArray(tags)) {
      sendJson(res, 400, { error: 'tags must be an array of strings' });
      return;
    }

    const note = addNote(db, content, tags as string[] | undefined);
    sendJson(res, 201, formatNote(note));
    return;
  }

  // GET /notes/search?q=... - Search notes by query
  if (method === 'GET' && segments.length === 2 && segments[0] === 'notes' && segments[1] === 'search') {
    const query = url.searchParams.get('q');
    if (!query) {
      sendJson(res, 400, { error: 'Query parameter q is required' });
      return;
    }
    const notes = searchNotes(db, query);
    sendJson(res, 200, notes.map(formatNote));
    return;
  }

  // GET /notes/tags/:tag - Get notes by tag
  if (method === 'GET' && segments.length === 3 && segments[0] === 'notes' && segments[1] === 'tags') {
    const notes = getNotesByTag(db, segments[2]);
    sendJson(res, 200, notes.map(formatNote));
    return;
  }

  // GET /notes - List all notes
  if (method === 'GET' && segments.length === 1 && segments[0] === 'notes') {
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const notes = listNotes(db, limit);
    sendJson(res, 200, notes.map(formatNote));
    return;
  }

  // DELETE /notes/:id - Delete a note by ID
  if (method === 'DELETE' && segments.length === 2 && segments[0] === 'notes') {
    const id = parseInt(segments[1], 10);
    if (isNaN(id)) {
      sendJson(res, 400, { error: 'Invalid note ID' });
      return;
    }
    const deleted = deleteNote(db, id);
    if (deleted) {
      res.writeHead(204);
      res.end();
    } else {
      sendJson(res, 404, { error: 'Note not found' });
    }
    return;
  }

  // Fall back to serving the static WebUI for GET requests
  if (method === 'GET') {
    serveStatic(res, url.pathname);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendJson(res, 500, { error: 'Internal server error', message });
  });
});

server.listen(PORT, () => {
  console.log(`Notes API server running on http://localhost:${PORT}`);
});
