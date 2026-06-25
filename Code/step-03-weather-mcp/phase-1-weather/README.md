# Phase 1: Weather MCP Server (Open-Meteo)

Wrap the [Open-Meteo](https://open-meteo.com/en/docs) weather API with the MCP
protocol. Open-Meteo is free and needs no API key.

> **The catch:** Open-Meteo only accepts **coordinates** (latitude/longitude),
> not place names. This server takes coordinates. In [phase 2](../phase-2-geocoding)
> we build a separate geocoding server that turns "Munich" into coordinates, and
> let an MCP client chain the two.

## What This Server Provides

### Tool
- `get_forecast(latitude, longitude)` — current weather for a coordinate

### Resource Template
- `weather://forecast/{latitude}/{longitude}` — weather data as a resource

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
1. Call `get_forecast` with `latitude: 48.1374`, `longitude: 11.5755` (Munich)
2. Read resource `weather://forecast/48.1374/11.5755`
3. Try invalid coordinates to see error handling

## Extension Challenge

Extend `get_forecast` with a multi-day daily forecast using Open-Meteo's `daily`
parameters (e.g. `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`).
