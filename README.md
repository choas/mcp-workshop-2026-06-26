# Build Your Own MCP Server and Develop AI Agents from Scratch

**VibeKode Munich 2026 Workshop**
**Friday, June 26, 2026**

Welcome! In this full-day hands-on workshop, you'll learn how to develop MCP (Model Context Protocol) servers and use them to build powerful AI agents.

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/choas/mcp-workshop-2026-06-26.git
cd mcp-workshop-2026-06-26/Code

# 2. Start the Notes App (Step 01)
cd step-01-notes-app
npm install
npm run dev

# 3. Open in browser
open http://localhost:3001
```

## Workshop Structure

| Folder | Description |
|--------|-------------|
| `Code/step-01-notes-app/` | Notes REST API + WebUI (pre-built, trainer explains) |
| `Code/step-02-notes-mcp/` | Notes MCP server (build incrementally) |
| `Code/step-03-weather-mcp/` | Weather + geocoding MCP servers the LLM composes |

### Step 02 Incremental Phases

```
step-02-notes-mcp/
├── phase-1-scaffold/    # Empty MCP server
├── phase-2-tools/       # Add CRUD tools
├── phase-3-resources/   # Add resources
├── phase-4-prompts/     # Add prompts
└── complete/            # Full implementation
```

### Step 03 Phases

```
step-03-weather-mcp/
├── phase-1-weather/     # weather-mcp (Open-Meteo, needs coordinates)
└── phase-2-geocoding/   # geocoding-mcp (Nominatim, place name -> coordinates)
```

## Workshop Flow

1. **Opening Demo** - See all MCP servers in action
2. **Step 01** - Explore the Notes App (API + WebUI)
3. **Step 02** - Build MCP server incrementally (tools -> resources -> prompts)
4. **Step 03** - Wrap external APIs with MCP and compose two servers (weather + geocoding)
5. **Integration** - Connect servers to LLM clients + explore community MCP servers
6. **Agents** - Put the tools in a loop to build an autonomous agent
7. **Security** - Defend the agent (lethal trifecta, human-in-the-loop) before shipping

## Prerequisites

- Node.js 22+ and npm 10+ (Node 22 is required for the built-in `node:sqlite` module)
- Git
- Code editor (VS Code recommended)
- Curiosity!

## Useful Commands

### MCP Inspector (test without LLM)

```bash
cd Code/step-02-notes-mcp/phase-2-tools
npm install
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

### Reset Database

```bash
rm data/notes.db
npm run dev  # Recreates automatically
```

## Optional Add-Ons

- [Build Your Own MCP Client](Presentation/appendix-mcp-client.md) — build the *other* half of
  the protocol; the clearest way to see how MCP works on the wire
- [Extension Challenges](EXTENSION_CHALLENGES.md) — bonus exercises if you finish early

## Resources

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Reference MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Awesome MCP Servers](https://github.com/wong2/awesome-mcp-servers)
- [Try MCP in your browser](https://try-mcp.dev)
- [VibeKode Conference](https://vibekode.it)

## Trainer

**Lars Gregori**
Technology Strategist | AI Prototyping Expert

- Blog: [larsgregori.de](https://larsgregori.de)
- LinkedIn: [/in/larsgregori](https://linkedin.com/in/larsgregori)

---

*Happy Vibe Coding!*
