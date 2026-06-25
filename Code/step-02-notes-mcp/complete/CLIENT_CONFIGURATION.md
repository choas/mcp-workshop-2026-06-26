# MCP Client Configuration Guide

This guide explains how to configure MCP clients (Claude Desktop and Cursor) to connect to the Personal Knowledge Assistant MCP server.

## Prerequisites

Before configuring clients, ensure the MCP server is working:

```bash
cd Code/step-02-notes-mcp/complete
npm install
npm run build
```

Test with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

## Claude Desktop Configuration

### Configuration File Location

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Configuration Format

Create or edit the configuration file with the following structure:

```json
{
  "mcpServers": {
    "knowledge-assistant": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/Code/step-02-notes-mcp/complete/src/index.ts"]
    }
  }
}
```

### Example (macOS)

```json
{
  "mcpServers": {
    "knowledge-assistant": {
      "command": "npx",
      "args": ["tsx", "/Users/username/projects/Code/step-02-notes-mcp/complete/src/index.ts"]
    }
  }
}
```

### Using node with tsx import

If you encounter ESM module issues, use the node command with the tsx import hook:

```json
{
  "mcpServers": {
    "knowledge-assistant": {
      "command": "node",
      "args": [
        "--import",
        "tsx",
        "/absolute/path/to/Code/step-02-notes-mcp/complete/src/index.ts"
      ]
    }
  }
}
```

### After Configuration

1. Save the configuration file
2. Restart Claude Desktop completely (quit and reopen)
3. Look for the MCP server icon in the Claude interface
4. The tools, resources, and prompts should now be available

## Cursor Configuration

### Configuration File Location

Create a `.cursor/mcp.json` file in your project root directory.

### Configuration Format

```json
{
  "mcpServers": {
    "knowledge-assistant": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/absolute/path/to/Code/step-02-notes-mcp/complete"
    }
  }
}
```

### Example

```json
{
  "mcpServers": {
    "knowledge-assistant": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "cwd": "/Users/username/projects/Code/step-02-notes-mcp/complete"
    }
  }
}
```

### Using node with the tsx loader

```json
{
  "mcpServers": {
    "knowledge-assistant": {
      "command": "node",
      "args": ["--import", "tsx", "src/index.ts"],
      "cwd": "/absolute/path/to/Code/step-02-notes-mcp/complete"
    }
  }
}
```

### After Configuration

1. Save the `.cursor/mcp.json` file
2. Restart Cursor or reload the window
3. The MCP server should connect automatically

## Available Features

Once configured, the following MCP primitives are available:

### Tools

| Tool | Description | Required Arguments |
|------|-------------|-------------------|
| `add_note` | Create a new note with optional tags | `content` (string) |
| `search_notes` | Search notes by keyword | `query` (string) |
| `list_notes` | List recent notes | `limit` (optional number) |
| `delete_note` | Delete a note by ID | `id` (number) |
| `get_quote` | Get a random inspirational quote | none |

### Resources

| URI | Description |
|-----|-------------|
| `notes://recent` | The 5 most recent notes |
| `notes://all` | All notes in the database |
| `notes://tags/{tag}` | Notes filtered by a specific tag |
| `notes://search/{query}` | Search notes by keyword |
| `quotes://random` | A random inspirational quote |

### Prompts

| Prompt | Description | Arguments |
|--------|-------------|-----------|
| `daily_summary` | Generate a daily summary with notes and a quote | none |
| `brainstorm_ideas` | Start a brainstorming session on a topic | `topic` (required) |
| `organize_notes` | Analyze notes and suggest better organization | `tag` (optional) |

## Troubleshooting

### Server not connecting

1. Verify the absolute path to `src/index.ts` is correct
2. Ensure `npm install` was run in the project directory
3. Check that Node.js and npm are in your PATH
4. Try running the server manually: `npx tsx src/index.ts`

### ESM module errors

If you see errors about ES modules, use the node command with `--import tsx` as shown in the examples above.

### Database errors

The SQLite database is stored in `data/notes.db`. If you encounter database issues:

1. Delete `data/notes.db`
2. Restart the MCP server (it will recreate the database)
3. Run `npm run seed` to populate sample data

### Checking server logs

For debugging, you can run the server with the MCP Inspector:

```bash
cd Code/step-02-notes-mcp/complete
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

This opens a web interface where you can test tools, resources, and prompts manually.
