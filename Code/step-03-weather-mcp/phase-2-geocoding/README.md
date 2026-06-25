# Phase 2: Geocoding MCP Server (Nominatim)

A **second, independent** MCP server whose only job is to turn a place name into
coordinates — the piece the [phase 1](../phase-1-weather) weather server needs.

Uses [Nominatim](https://nominatim.org/release-docs/latest/api/Search/)
(OpenStreetMap). Free, no key — but it **requires a descriptive `User-Agent`**
header identifying your app, and asks that you keep request volume modest.

## What This Server Provides

### Tool
- `search_location(query)` — search a place by name (city, optionally with
  street) and get back matching latitude/longitude coordinates

### Resource Template
- `geo://search/{query}` — matching coordinates as a resource

## Running the Server

```bash
npm install
npm run dev
```

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

Try:
1. Call `search_location` with query `"Munich"` → note the latitude/longitude
2. Call `search_location` with `"Marienplatz, Munich"` for a street-level result
3. Read resource `geo://search/Munich`

## Putting It Together

This server is only half of the story. To answer *"What's the weather in Munich?"*
you run **both** servers and let an MCP client (Claude Desktop, Inspector, or
your own client) chain them: `search_location` here → `get_forecast` on the
weather server. See the [step README](../README.md) for the client config.
