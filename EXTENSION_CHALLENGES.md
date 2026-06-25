# Extension Challenges

Bonus challenges for participants who finish early or want to explore further.

---

## Beginner Challenges

### 1. Add an `update_note` Tool

Extend the notes system to allow editing existing notes.

**Requirements:**
- Tool name: `update_note`
- Inputs: `id` (required), `content` (optional), `tags` (optional)
- Only update fields that are provided
- Return the updated note

**Hints:**
```typescript
inputSchema: {
  type: "object",
  properties: {
    id: { type: "number", description: "Note ID to update" },
    content: { type: "string", description: "New content (optional)" },
    tags: { type: "string", description: "New tags (optional)" }
  },
  required: ["id"]
}
```

**SQL:**
```sql
UPDATE notes SET content = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
```

---

### 2. Add a `notes://stats` Resource

Create a resource that returns statistics about the notes.

**Returns:**
```json
{
  "total_notes": 42,
  "total_tags": 15,
  "most_used_tags": ["work", "ideas", "todo"],
  "notes_today": 5,
  "notes_this_week": 12
}
```

**SQL helpers:**
```sql
SELECT COUNT(*) as total FROM notes;
SELECT tags FROM notes WHERE tags IS NOT NULL;
SELECT COUNT(*) FROM notes WHERE date(created_at) = date('now');
```

---

### 3. Add a `get_joke` Tool

Connect to a joke API for some fun.

**API:** https://official-joke-api.appspot.com/random_joke

**Returns:**
```json
{
  "setup": "Why don't scientists trust atoms?",
  "punchline": "Because they make up everything!"
}
```

---

## Intermediate Challenges

### 4. Add Note Archiving

Implement soft-delete functionality.

**Changes needed:**
1. Add `archived` column to database schema
2. Create `archive_note` tool (sets archived = true)
3. Create `restore_note` tool (sets archived = false)
4. Update `list_notes` to exclude archived by default
5. Add `notes://archived` resource to view archived notes

**Schema change:**
```sql
ALTER TABLE notes ADD COLUMN archived INTEGER DEFAULT 0;
```

---

### 5. Add Note Categories

Extend the tag system with hierarchical categories.

**New tool:** `set_category`
- Inputs: `note_id`, `category` (e.g., "work/projects/alpha")
- Categories are hierarchical (parent/child)

**New resources:**
- `notes://category/{path}` - Notes in a category
- `notes://categories` - List all categories as tree

---

### 6. Export Notes Tool

Create a tool that exports notes to different formats.

**Tool:** `export_notes`
- Inputs: `format` ("json", "markdown", "csv"), `tag` (optional filter)
- Returns formatted content

**Markdown output example:**
```markdown
# My Notes

## Note 1
Content here...
Tags: work, ideas

## Note 2
...
```

---

### 7. Add a Second API Integration

Connect to a news API for current events.

**Suggested APIs:**
- NewsAPI: https://newsapi.org (requires free API key)
- Hacker News: https://hacker-news.firebaseio.com/v0/topstories.json

**New tools:**
- `get_news` - Fetch top headlines
- `search_news` - Search for specific topics

**New resources:**
- `news://top` - Top 10 headlines
- `news://search/{query}` - Search results

---

## Advanced Challenges

### 8. Build a Second MCP Server

Create a completely separate MCP server for a different domain.

**Ideas:**
- **Bookmark Manager** - Save, tag, and search URLs
- **Habit Tracker** - Log daily habits, view streaks
- **Recipe Book** - Store and search recipes
- **Flashcard System** - Create and review flashcards

**Requirements:**
- Separate project folder
- At least 3 tools
- At least 2 resources
- At least 1 prompt

---

### 9. Add Authentication

Secure your MCP server with API key authentication.

**Approach:**
1. Read API key from environment variable
2. Validate key on server startup
3. Consider: How would you pass credentials from MCP client?

**Note:** MCP doesn't have built-in auth - this is a design exercise.

---

### 10. Implement Resource Subscriptions

Add real-time updates when notes change.

**MCP supports subscriptions:**
```typescript
// Notify clients when resources change
server.notification({
  method: "notifications/resources/updated",
  params: { uri: "notes://recent" }
});
```

**Trigger on:**
- Note created
- Note updated
- Note deleted

---

### 11. Add WebSocket Transport

Replace stdio with HTTP+SSE transport for network access.

**Changes:**
```typescript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();
app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});
```

---

### 12. Build a Custom MCP Client

Create a CLI tool that talks to your MCP server.

**Features:**
- List available tools
- Call tools interactively
- Browse resources
- No LLM needed - direct protocol access

**Starting point:**
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
```

**Full walkthrough:** See [Appendix: Build Your Own MCP Client](Presentation/appendix-mcp-client.md)
— it drives the protocol end to end (handshake, discovery, tool calls) and
optionally bolts an LLM on top to make a tiny agent.

---

## Boss Mode Challenges

### 13. Multi-Server Orchestration

Connect multiple MCP servers and have them work together.

**Scenario:**
- Notes server has your notes
- Weather server has weather data
- Create a prompt that combines both: "What should I do today based on my todos and the weather?"

---

### 14. MCP Server for Slides

Remember the meta idea from brainstorming? Build it!

**Tools:**
- `update_slide` - Modify slide content
- `add_slide` - Insert new slide
- `get_current_slide` - What's being shown

**Resources:**
- `slides://current` - Current slide content
- `slides://all` - All slides

**Integration:**
- Read/write Marp markdown files
- Could trigger live reload

---

### 15. Performance Optimization

Make your MCP server handle 1000+ notes efficiently.

**Techniques:**
- Add database indexes
- Implement pagination for list tools
- Cache frequently accessed resources
- Measure response times

**Test data:**
```typescript
// Generate 1000 test notes
for (let i = 0; i < 1000; i++) {
  db.prepare("INSERT INTO notes (content, tags) VALUES (?, ?)")
    .run(`Test note ${i}`, `tag${i % 10}`);
}
```

---

## Submission (Optional)

Completed a challenge? Share it!

1. Create a branch with your solution
2. Add a README explaining what you built
3. Share the link with the group

**Recognition:**
- Best tool implementation
- Most creative use case
- Best code quality
- Most ambitious project

---

## Tips

- Start with the easier challenges to build confidence
- Read the MCP SDK source code for advanced patterns
- Ask neighbors for help or pair up
- Check the completed reference code for inspiration (each step has a `complete/` or final-phase folder, e.g. `Code/step-02-notes-mcp/complete`)
- Don't worry about perfect code - it's about learning!
