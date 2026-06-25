// Weather MCP Server (Phase 1)
// Wraps the Open-Meteo API with the MCP protocol.
//
// Open-Meteo only accepts coordinates (latitude/longitude), NOT place names.
// This server exposes a `get_forecast` tool that takes coordinates. In phase 2
// we build a *separate* geocoding server that turns "Munich" into coordinates,
// and an MCP client can then chain the two together.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// --- Weather (Open-Meteo) --------------------------------------------------

interface WeatherData {
  latitude: number;
  longitude: number;
  temperature: string;
  condition: string;
  humidity: string;
  wind: string;
}

// WMO weather interpretation codes used by Open-Meteo.
const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

// Fetch the current weather for a latitude/longitude from Open-Meteo.
async function getForecast(latitude: number, longitude: number): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code'
  );

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    current: {
      temperature_2m: number;
      relative_humidity_2m: number;
      wind_speed_10m: number;
      weather_code: number;
    };
    current_units: {
      temperature_2m: string;
      relative_humidity_2m: string;
      wind_speed_10m: string;
    };
  };

  const { current, current_units } = data;

  return {
    latitude,
    longitude,
    temperature: `${current.temperature_2m}${current_units.temperature_2m}`,
    condition: WEATHER_CODES[current.weather_code] ?? `Unknown (code ${current.weather_code})`,
    humidity: `${current.relative_humidity_2m}${current_units.relative_humidity_2m}`,
    wind: `${current.wind_speed_10m} ${current_units.wind_speed_10m}`,
  };
}

// Initialize MCP Server
const server = new Server(
  {
    name: 'weather-mcp',
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
const forecastTool = {
  name: 'get_forecast',
  description:
    'Get the current weather forecast for a latitude/longitude. Only accepts coordinates — use the geocoding server\'s search_location tool first if you only have a place name.',
  inputSchema: {
    type: 'object',
    properties: {
      latitude: {
        type: 'number',
        description: 'Latitude, e.g. 48.1374',
      },
      longitude: {
        type: 'number',
        description: 'Longitude, e.g. 11.5755',
      },
    },
    required: ['latitude', 'longitude'],
  },
};

// Resource template
const weatherResourceTemplate = {
  uriTemplate: 'weather://forecast/{latitude}/{longitude}',
  name: 'Weather Forecast',
  description: 'Current weather data for a latitude/longitude',
  mimeType: 'application/json',
};

// Handle tools/list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [forecastTool] };
});

// Handle tools/call
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  if (name === 'get_forecast') {
    const latitude = args.latitude as number;
    const longitude = args.longitude as number;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return {
        content: [{ type: 'text', text: 'Error: latitude and longitude are required' }],
        isError: true,
      };
    }

    try {
      const weather = await getForecast(latitude, longitude);
      const text = `Weather at ${weather.latitude}, ${weather.longitude}:
- Temperature: ${weather.temperature}
- Condition: ${weather.condition}
- Humidity: ${weather.humidity}
- Wind: ${weather.wind}`;

      return { content: [{ type: 'text', text }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: 'text', text: `Failed to get forecast: ${message}` }],
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
  return { resourceTemplates: [weatherResourceTemplate] };
});

// Handle resources/read
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  const match = uri.match(/^weather:\/\/forecast\/([^/]+)\/([^/]+)$/);
  if (match) {
    const latitude = Number(decodeURIComponent(match[1]));
    const longitude = Number(decodeURIComponent(match[2]));
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new Error(`Invalid coordinates in URI: ${uri}`);
    }

    try {
      const weather = await getForecast(latitude, longitude);
      return {
        contents: [{
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(weather, null, 2),
        }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to read weather resource: ${message}`);
    }
  }

  throw new Error(`Unknown resource URI: ${uri}`);
});

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Weather MCP server running');
