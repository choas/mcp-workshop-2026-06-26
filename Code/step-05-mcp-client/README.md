# Step 05 — Build Your Own MCP Client

The rest of the workshop builds MCP **servers** and lets a host (Claude Desktop,
Cursor, …) supply the **client**. This step flips it around: you build the
**client** yourself. It's the best way to actually *see* the protocol — the
handshake, discovery, and tool calls — instead of taking the host's word for it.

Implements the [appendix](../../Presentation/appendix-mcp-client.md):
a no-LLM protocol driver (`client.ts`) and an optional tiny agent (`agent.ts`).

## Quick start

```bash
npm install

# Step 1 + 2: drive the protocol, no LLM. The client spawns the completed
# Notes MCP server (step-02) as a subprocess, does the handshake, discovers
# tools/resources/prompts, calls a tool, and reads a resource.
npm run client

# See every raw JSON-RPC frame on the wire (proof it's "just JSON over a pipe"):
DEBUG=1 npm run client
```

Both scripts point at `../step-02-notes-mcp/complete/src/index.ts`, so make sure
you've run `npm install` in that folder too.

## What it does

| File              | Appendix step | What it shows                                              |
| ----------------- | ------------- | --------------------------------------------------------- |
| `src/client.ts`   | Steps 1 & 2   | Minimal client + raw message logging (a tiny Inspector).  |
| `src/agent.ts`    | Step 3        | Bolt an LLM on top → the model picks the tools = an agent. |

### The protocol, in the order you'll see it

```
initialize        →  handshake (done inside client.connect())
tools/list        →  discovery
resources/list    →  discovery
prompts/list      →  discovery
tools/call        →  execution
resources/read    →  execution
```

Run with `DEBUG=1` and every line above shows up as a `→ SENT` / `← RECEIVED`
JSON-RPC frame. That's the whole protocol.

## Step 3 (optional) — add an LLM → a tiny agent

A client without an LLM is a remote control. Add an LLM and the **model** decides
*which* tool to call — which is exactly what a host does. The loop: send the
message + tool list to the model → run any tool calls via MCP → feed results
back → repeat until it answers in plain language.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run agent -- "Add a note about the workshop, then list my notes"

# Workshop hosted gateway instead of the public API:
export ANTHROPIC_BASE_URL=https://your-litellm-gateway/...
npm run agent
```

The agent loops over multiple turns, so the model can chain several tool calls
(e.g. add a note *then* list notes) before giving a final answer.

## Notes

- **stdout is sacred.** The server must log to **stderr** only — stdout carries
  the JSON-RPC frames. That's why the workshop servers use `console.error(...)`.
- **Match the server's schema.** This server's `add_note` wants `tags` as a
  string **array** (`["workshop", "mcp"]`), not a comma-string. Check the
  `tools/list` output (`inputSchema`) before guessing argument shapes.
- **Dependencies** are pinned to versions published well over 24 hours ago
  (`@modelcontextprotocol/sdk` 1.29.0, `@anthropic-ai/sdk` 0.106.0) as a small
  supply-chain precaution.

## Where to go next

- Call `client.getPrompt({ name, arguments })` and feed the rendered prompt to
  the model.
- Connect to **two** servers (notes + weather) from one client and merge their
  tool lists into one agent.
- Swap `StdioClientTransport` for a Streamable HTTP transport to reach a remote
  server — same `Client`, different import.
