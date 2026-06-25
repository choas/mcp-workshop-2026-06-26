# Block 2: Build Notes MCP Server

---

## What We're Building

An MCP server that wraps our Notes API:

- **Phase 1**: Empty scaffold (just connects)
- **Phase 2**: Add tools (CRUD operations)
- **Phase 3**: Add resources (read-only data)
- **Phase 4**: Add prompts (reusable templates)

---

## MCP Inspector

### Your Development Best Friend

Test MCP servers without needing an LLM!

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

---

## MCP Inspector Features

1. **See all tools** - List and inspect schemas
2. **Call tools** - Execute with custom arguments
3. **Browse resources** - List and read data
4. **Test prompts** - Get prompt templates
5. **View messages** - See raw JSON-RPC traffic

---

## Phase 1: Scaffold

### Goal: MCP server that connects but does nothing

```bash
cd Code/step-02-notes-mcp/phase-1-scaffold
npm install
```

---

## Phase 1: The Code

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'notes-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## Phase 1: Test It

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

You should see:
- Server connects
- Tools list is empty
- No errors

---

## Phase 2: Adding Tools

### What is a Tool?

A function the LLM can call to perform actions.

- **name** - Unique identifier
- **description** - Helps LLM decide when to use it
- **inputSchema** - JSON Schema for parameters

---

## Phase 2: Tool Definition

```typescript
{
  name: "add_note",
  description: "Create a new note",
  inputSchema: {
    type: "object",
    properties: {
      content: { type: "string" },
      tags: { type: "array", items: { type: "string" } }
    },
    required: ["content"]
  }
}
```

---

## Phase 2: Our Tools

| Tool | Description |
|------|-------------|
| `list_notes` | List recent notes |
| `add_note` | Create a new note |
| `search_notes` | Search by keyword |
| `delete_note` | Delete by ID |

---

## Phase 2: List Tools Handler

```typescript
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: noteToolDefinitions };
});
```

---

## Phase 2: Call Tool Handler

```typescript
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'list_notes':
      return handleListNotes(db, args);
    // ... other tools
  }
});
```

---

## Phase 2: Tool Response Format

```typescript
// Success
return {
  content: [{ type: "text", text: "Note created!" }]
};

// Error
return {
  content: [{ type: "text", text: "Error: invalid input" }],
  isError: true
};
```

---

## Phase 2: Exercise

```bash
cd Code/step-02-notes-mcp/phase-2-tools
npm install
```

**Vibe Coding Prompt:**
> Add a list_notes tool that returns recent notes from SQLite.
> Use ListToolsRequestSchema and CallToolRequestSchema.

---

## Phase 2: Test Tools

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

### Checklist
- [ ] See all 4 tools listed
- [ ] Call `add_note` with content
- [ ] Call `list_notes` to see it
- [ ] Call `search_notes` with a query

---

## Phase 3: Adding Resources

### Tools vs Resources

| Tools | Resources |
|-------|-----------|
| Actions | Data |
| `add_note()` | `notes://recent` |
| Execute | Read |
| Verbs | Nouns |

---

## Phase 3: Why Resources?

- **Context**: Give LLM background info
- **Exploration**: Let LLM browse data
- **Separation**: Read vs Write concerns

---

## Phase 3: Resource Types

**Static Resource:**
```typescript
{ uri: "notes://recent", name: "Recent Notes" }
```

**Resource Template:**
```typescript
{ uriTemplate: "notes://tags/{tag}", name: "Notes by Tag" }
```

---

## Phase 3: Our Resources

| URI | Description |
|-----|-------------|
| `notes://recent` | Last 5 notes |
| `notes://all` | All notes |
| `notes://tags/{tag}` | Filter by tag |
| `notes://search/{query}` | Search results |

---

## Phase 3: List Resources

```typescript
import { ListResourcesRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: noteResources };
});
```

---

## Phase 3: Read Resource

```typescript
import { ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'notes://recent') {
    const notes = getRecentNotes(db);
    return {
      contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(notes) }]
    };
  }
});
```

---

## Phase 3: Exercise

```bash
cd Code/step-02-notes-mcp/phase-3-resources
npm install
```

**Vibe Coding Prompt:**
> Add MCP resources: notes://recent, notes://all, and
> templates notes://tags/{tag}, notes://search/{query}

---

## Phase 3: Test Resources

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

### Checklist
- [ ] Resources tab shows static resources
- [ ] Templates tab shows templates
- [ ] Can read notes://recent
- [ ] Can read notes://tags/work

---

## Phase 4: Adding Prompts

### What are Prompts?

Reusable prompt templates stored on the server.

- Consistency across uses
- Include dynamic data
- Encode best practices

---

## Phase 4: Prompt Definition

```typescript
{
  name: "daily_summary",
  description: "Summarize recent notes",
  arguments: []
}
```

---

## Phase 4: Our Prompts

| Prompt | Arguments | Purpose |
|--------|-----------|---------|
| `daily_summary` | none | Summarize notes |
| `brainstorm_ideas` | topic | Creative ideation |
| `organize_notes` | tag? | Suggest organization |

---

## Phase 4: List Prompts

```typescript
import { ListPromptsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return { prompts: promptDefinitions };
});
```

---

## Phase 4: Get Prompt

```typescript
import { GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'daily_summary') {
    const notes = getRecentNotes(db);
    return {
      messages: [{
        role: 'user',
        content: { type: 'text', text: `Summarize: ${notes}` }
      }]
    };
  }
});
```

---

## Phase 4: Exercise

```bash
cd Code/step-02-notes-mcp/phase-4-prompts
npm install
```

**Vibe Coding Prompt:**
> Add prompts: daily_summary (no args), brainstorm_ideas (topic required),
> organize_notes (optional tag filter)

---

## Phase 4: Test Prompts

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

### Checklist
- [ ] Prompts tab shows all 3
- [ ] Get daily_summary returns prompt
- [ ] brainstorm_ideas requires topic
- [ ] organize_notes works with/without tag

---

## Complete Server Summary

```
Notes MCP Server
├── TOOLS (4)
│   ├── list_notes
│   ├── add_note
│   ├── search_notes
│   └── delete_note
├── RESOURCES (4)
│   ├── notes://recent
│   ├── notes://all
│   ├── notes://tags/{tag}
│   └── notes://search/{query}
└── PROMPTS (3)
    ├── daily_summary
    ├── brainstorm_ideas
    └── organize_notes
```

---

## Common Pitfalls

### Wrong Response Format

```typescript
// Wrong
return { text: "Success" };

// Correct
return { content: [{ type: "text", text: "Success" }] };
```

---

## Common Pitfalls

### Missing Error Handling

```typescript
try {
  const result = await doSomething();
  return { content: [{ type: "text", text: result }] };
} catch (error) {
  return {
    content: [{ type: "text", text: `Error: ${error.message}` }],
    isError: true
  };
}
```

---

## Break Time

Back in 15 minutes!

**Check:**
- All 4 tools work
- All 4 resources readable
- All 3 prompts return messages

---

*Next: [Block 3 - Weather MCP Server](03-weather-mcp.md)*
