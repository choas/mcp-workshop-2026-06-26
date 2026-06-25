# Phase 2: Adding Tools

## Goal
Add tools so the LLM can create, list, search, and delete notes.

## Vibe Coding Prompts

### Step 1: Add database layer
> "Create a database.ts that initializes SQLite with the built-in node:sqlite module (DatabaseSync).
> Create a notes table with id, content, tags, created_at, updated_at.
> Add functions: addNote, listNotes, searchNotes, deleteNote."

### Step 2: Add list_notes tool
> "Add a list_notes tool to the MCP server.
> It should return the 10 most recent notes from the database.
> Use ListToolsRequestSchema and CallToolRequestSchema handlers."

### Step 3: Add remaining tools
> "Add add_note, search_notes, and delete_note tools.
> Each tool needs a definition (name, description, inputSchema)
> and a handler function."

## Prerequisites

Make sure you have some notes in step-01-notes-app first:
1. Start the Notes API: `cd ../../step-01-notes-app && npm run dev`
2. Add notes via the WebUI at http://localhost:3001

This MCP server shares the same database as the Notes App.

## Test with MCP Inspector

```bash
npm install
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

Try each tool:
1. `add_note` with content "Test note" and tags ["test"]
2. `list_notes` to see your note
3. `search_notes` with query "Test"
4. `delete_note` with the note ID

## Next Step
Move to phase-3-resources to expose data as resources!
