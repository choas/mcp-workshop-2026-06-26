// Geocoding MCP Server (Phase 2)
// Wraps the Nominatim (OpenStreetMap) search API with the MCP protocol.
//
// Its single job: turn a place name (city, optionally with street) into
// latitude/longitude coordinates. This is the missing piece the Open-Meteo
// weather server (phase 1) needs — Open-Meteo only accepts coordinates.
//
// Run BOTH servers and an MCP client can answer "weather in Munich?" by calling
// search_location here, then get_forecast on the weather server.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// --- Geocoding (Nominatim) -------------------------------------------------

interface GeoLocation {
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

// Search a place (city, optionally with street) and return matching coordinates.
// Nominatim requires a descriptive User-Agent identifying the application.
async function searchLocation(query: string, limit = 5): Promise<GeoLocation[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url, {
    headers: { 'User-Agent': 'vibekode-geocoding-mcp/1.0 (workshop example)' },
  });

  if (!response.ok) {
    throw new Error(`Geocoding API error: ${response.status}`);
  }

  const data = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    type: string;
  }>;

  return data.map((item) => ({
    name: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    type: item.type,
  }));
}

// Initialize MCP Server
const server = new Server(
  {
    name: 'geocoding-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Tool definition
const searchLocationTool = {
  name: 'search_location',
  description:
    'Search for a place by name (city, optionally with street) and return matching latitude/longitude coordinates. Pass the coordinates to the weather server\'s get_forecast tool.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Place to search for, e.g. "Munich" or "Marienplatz, Munich"',
      },
    },
    required: ['query'],
  },
};

// Resource template
const geoResourceTemplate = {
  uriTemplate: 'geo://search/{query}',
  name: 'Geocoding Search',
  description: 'Matching coordinates for a place name',
  mimeType: 'application/json',
};

// Handle tools/list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [searchLocationTool] };
});

// Handle tools/call
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === 'search_location') {
    const query = args.query as string;
    if (!query) {
      return {
        content: [{ type: 'text', text: 'Error: query is required' }],
        isError: true,
      };
    }

    try {
      const results = await searchLocation(query);
      if (results.length === 0) {
        return { content: [{ type: 'text', text: `No locations found for "${query}"` }] };
      }

      const text = results
        .map(
          (r, i) =>
            `${i + 1}. ${r.name}\n   latitude: ${r.latitude}, longitude: ${r.longitude} (${r.type})`
        )
        .join('\n');

      return { content: [{ type: 'text', text }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: 'text', text: `Failed to search location: ${message}` }],
        isError: true,
      };
    }
  }

  return {
    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
    isError: true,
  };
});

// Handle resources/templates/list
server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
  return { resourceTemplates: [geoResourceTemplate] };
});

// Handle resources/read
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const match = uri.match(/^geo:\/\/search\/(.+)$/);
  if (match) {
    const query = decodeURIComponent(match[1]);

    try {
      const results = await searchLocation(query);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(results, null, 2),
        }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read geocoding resource: ${message}`);
    }
  }

  throw new Error(`Unknown resource URI: ${uri}`);
});

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Geocoding MCP server running');
