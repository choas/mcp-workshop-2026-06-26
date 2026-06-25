# MCP Cheat Sheet

Quick reference for Model Context Protocol development.

---

## The Three Primitives

| Primitive | Purpose | Direction | Example |
|-----------|---------|-----------|---------|
| **Tools** | Actions LLM can execute | LLM -> Server | `add_note`, `get_forecast` |
| **Resources** | Read-only data access | Server -> LLM | `notes://recent`, `weather://forecast/48.14/11.58` |
| **Prompts** | Reusable templates | Server -> LLM | `daily_summary`, `brainstorm_ideas` |

---

## Server Setup

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);

// Register handlers here...

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Tools

### Register Tool List

```typescript
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "add_note",
      description: "Create a new note with content and optional tags",
      inputSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "Note content" },
          tags: { type: "string", description: "Comma-separated tags" }
        },
        required: ["content"]
      }
    }
  ]
}));
```

### Handle Tool Calls

```typescript
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "add_note":
      const result = await createNote(args.content, args.tags);
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
```

---

## Resources

### Register Resource List

```typescript
import { ListResourcesRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "notes://recent",
      name: "Recent Notes",
      description: "Last 10 notes",
      mimeType: "application/json"
    }
  ]
}));
```

### Register Resource Templates

```typescript
import { ListResourceTemplatesRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
  resourceTemplates: [
    {
      uriTemplate: "notes://tags/{tag}",
      name: "Notes by Tag",
      description: "Filter notes by tag"
    }
  ]
}));
```

### Read Resources

```typescript
import { ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === "notes://recent") {
    const notes = getRecentNotes(10);
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(notes)
      }]
    };
  }

  // Handle templates
  const tagMatch = uri.match(/^notes:\/\/tags\/(.+)$/);
  if (tagMatch) {
    const tag = tagMatch[1];
    const notes = getNotesByTag(tag);
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(notes)
      }]
    };
  }

  throw new Error(`Resource not found: ${uri}`);
});
```

---

## Prompts

### Register Prompt List

```typescript
import { ListPromptsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: "daily_summary",
      description: "Summarize today's notes",
      arguments: [
        { name: "style", description: "Summary style", required: false }
      ]
    }
  ]
}));
```

### Get Prompt Content

```typescript
import { GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "daily_summary") {
    const notes = getTodaysNotes();
    const style = args?.style || "concise";

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Summarize these notes in a ${style} style:\n\n${JSON.stringify(notes)}`
          }
        }
      ]
    };
  }

  throw new Error(`Prompt not found: ${name}`);
});
```

---

## Response Formats

### Tool Response
```typescript
{
  content: [
    { type: "text", text: "Result message" }
  ]
}
```

### Resource Response
```typescript
{
  contents: [
    {
      uri: "notes://recent",
      mimeType: "application/json",
      text: '{"notes": [...]}'
    }
  ]
}
```

### Prompt Response
```typescript
{
  messages: [
    {
      role: "user",
      content: { type: "text", text: "Prompt content..." }
    }
  ]
}
```

---

## Error Handling

```typescript
// Throw errors with descriptive messages
throw new Error(`Note not found: ${id}`);

// Or return error in content
return {
  content: [{
    type: "text",
    text: JSON.stringify({ error: "Note not found", id })
  }],
  isError: true
};
```

---

## Testing with MCP Inspector

```bash
# Start inspector with your server
npx @modelcontextprotocol/inspector npx tsx src/index.ts

# Opens browser UI to test:
# - List and call tools
# - Browse resources
# - Test prompts
```

---

## Client Configuration

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["tsx", "/path/to/src/index.ts"]
    }
  }
}
```

### With Environment Variables

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["tsx", "src/index.ts"],
      "env": {
        "API_KEY": "your-key",
        "PORT": "3001"
      }
    }
  }
}
```

---

## Common Patterns

### Fetch from REST API
```typescript
case "get_forecast":
  const url = `https://api.open-meteo.com/v1/forecast`
    + `?latitude=${args.latitude}&longitude=${args.longitude}`
    + `&current=temperature_2m,weather_code`;
  const response = await fetch(url);
  const data = await response.json();
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
```

### Database Query
```typescript
case "search_notes":
  const stmt = db.prepare("SELECT * FROM notes WHERE content LIKE ?");
  const notes = stmt.all(`%${args.query}%`);
  return { content: [{ type: "text", text: JSON.stringify(notes) }] };
```

### Input Validation
```typescript
if (!args.content || args.content.trim() === "") {
  throw new Error("Content is required and cannot be empty");
}
```

---

## Key Imports

```typescript
// Server
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Request schemas
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
```

---

## Quick Debugging

```typescript
// Log to stderr (stdout is for MCP protocol)
console.error("Debug:", someVariable);

// Log incoming requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error("Tool called:", request.params.name, request.params.arguments);
  // ...
});
```

---

## Links

- **MCP Spec**: https://modelcontextprotocol.io
- **SDK Docs**: https://github.com/modelcontextprotocol/typescript-sdk
- **Reference Servers**: https://github.com/modelcontextprotocol/servers
- **Awesome MCP Servers**: https://github.com/wong2/awesome-mcp-servers
- **Try MCP in your browser**: https://try-mcp.dev
