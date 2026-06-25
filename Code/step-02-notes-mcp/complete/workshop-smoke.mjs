// workshop-smoke.mjs — optional end-to-end check that every MCP server in the
// workshop starts and behaves. Handy for verifying your setup before the day.
//
// Prerequisites:
//   1. Build every phase/server first (in each folder): npm install && npm run build
//      (this script launches the built dist/index.js of each server)
//   2. Run it from THIS folder (Code/step-02-notes-mcp/complete):
//        node workshop-smoke.mjs
//
// It checks phases 1-4, the complete server, and the weather + geocoding
// servers, then exits non-zero if any of them is broken.

import { resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const repoRoot = resolve(process.cwd(), '../../..');

const paths = {
  phase1: resolve(repoRoot, 'Code/step-02-notes-mcp/phase-1-scaffold/dist/index.js'),
  phase2: resolve(repoRoot, 'Code/step-02-notes-mcp/phase-2-tools/dist/index.js'),
  phase3: resolve(repoRoot, 'Code/step-02-notes-mcp/phase-3-resources/dist/index.js'),
  phase4: resolve(repoRoot, 'Code/step-02-notes-mcp/phase-4-prompts/dist/index.js'),
  complete: resolve(repoRoot, 'Code/step-02-notes-mcp/complete/dist/index.js'),
  weather: resolve(repoRoot, 'Code/step-03-weather-mcp/phase-1-weather/dist/index.js'),
  geocoding: resolve(repoRoot, 'Code/step-03-weather-mcp/phase-2-geocoding/dist/index.js'),
};

const failures = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function textOf(result) {
  return result.content?.map((item) => item.text ?? '').join('\n') ?? '';
}

async function withClient(label, serverPath, fn) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
  });
  const client = new Client({ name: `smoke-${label}`, version: '1.0.0' });

  try {
    await client.connect(transport);
    await fn(client);
    console.log(`PASS ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${label}: ${message}`);
    console.log(`FAIL ${label}: ${message}`);
  } finally {
    try {
      await client.close();
    } catch {
      // Ignore close errors after failed startup.
    }
  }
}

await withClient('phase-1 scaffold lists zero tools', paths.phase1, async (client) => {
  const result = await client.listTools();
  assert(Array.isArray(result.tools), 'tools/list did not return a tools array');
  assert(result.tools.length === 0, `expected 0 tools, got ${result.tools.length}`);
});

await withClient('phase-2 tools CRUD', paths.phase2, async (client) => {
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();
  assert(names.join(',') === 'add_note,delete_note,list_notes,search_notes', `unexpected tools: ${names.join(',')}`);

  const created = await client.callTool({
    name: 'add_note',
    arguments: { content: 'Temporary note created by MCP smoke test', tags: ['smoke', 'delete-me'] },
  });
  const match = textOf(created).match(/ID:\s*(\d+)/);
  assert(match, `could not parse created note id from: ${textOf(created)}`);

  const listed = await client.callTool({ name: 'list_notes', arguments: { limit: 5 } });
  assert(textOf(listed).includes('Temporary note created by MCP smoke test'), 'created note missing from list_notes');

  const searched = await client.callTool({ name: 'search_notes', arguments: { query: 'Temporary note' } });
  assert(textOf(searched).includes('Temporary note created by MCP smoke test'), 'created note missing from search_notes');

  const deleted = await client.callTool({ name: 'delete_note', arguments: { id: Number(match[1]) } });
  assert(textOf(deleted).includes('deleted successfully'), `delete_note did not confirm delete: ${textOf(deleted)}`);
});

await withClient('phase-3 resources', paths.phase3, async (client) => {
  let createdId;
  const { resources } = await client.listResources();
  const resourceUris = resources.map((resource) => resource.uri).sort();
  assert(resourceUris.join(',') === 'notes://all,notes://recent', `unexpected resources: ${resourceUris.join(',')}`);

  const { resourceTemplates } = await client.listResourceTemplates();
  const templateUris = resourceTemplates.map((template) => template.uriTemplate).sort();
  assert(templateUris.join(',') === 'notes://search/{query},notes://tags/{tag}', `unexpected templates: ${templateUris.join(',')}`);

  try {
    const created = await client.callTool({
      name: 'add_note',
      arguments: { content: 'Temporary work note created by MCP smoke test', tags: ['work', 'smoke'] },
    });
    const match = textOf(created).match(/ID:\s*(\d+)/);
    assert(match, `could not parse phase-3 note id from: ${textOf(created)}`);
    createdId = Number(match[1]);

    const recent = await client.readResource({ uri: 'notes://recent' });
    assert(recent.contents.length === 1, 'notes://recent did not return one content item');

    const tagged = await client.readResource({ uri: 'notes://tags/work' });
    const notes = JSON.parse(tagged.contents[0].text);
    assert(notes.length > 0, 'notes://tags/work returned no notes');
    const badMatches = notes.filter((note) => !String(note.tags ?? '').split(',').includes('work'));
    assert(badMatches.length === 0, `notes://tags/work returned non-work tags: ${badMatches.map((note) => note.tags).join('; ')}`);
  } finally {
    if (createdId !== undefined) {
      await client.callTool({ name: 'delete_note', arguments: { id: createdId } });
    }
  }
});

await withClient('phase-4 prompts', paths.phase4, async (client) => {
  const { prompts } = await client.listPrompts();
  const promptNames = prompts.map((prompt) => prompt.name).sort();
  assert(promptNames.join(',') === 'brainstorm_ideas,daily_summary,organize_notes', `unexpected prompts: ${promptNames.join(',')}`);

  const daily = await client.getPrompt({ name: 'daily_summary' });
  assert(daily.messages.length === 1, 'daily_summary did not return one message');

  const brainstorm = await client.getPrompt({ name: 'brainstorm_ideas', arguments: { topic: 'MCP' } });
  assert(brainstorm.messages.length === 1, 'brainstorm_ideas did not return one message');

  const organize = await client.getPrompt({ name: 'organize_notes', arguments: { tag: 'work' } });
  assert(organize.messages.length === 1, 'organize_notes did not return one message');
});

await withClient('complete server extras', paths.complete, async (client) => {
  const { tools } = await client.listTools();
  assert(tools.some((tool) => tool.name === 'get_quote'), 'get_quote tool missing');

  const quote = await client.callTool({ name: 'get_quote', arguments: {} });
  assert(textOf(quote).length > 0, 'get_quote returned empty text');

  const quoteResource = await client.readResource({ uri: 'quotes://random' });
  assert(quoteResource.contents.length === 1, 'quotes://random did not return one content item');
});

await withClient('weather server', paths.weather, async (client) => {
  const { tools } = await client.listTools();
  assert(tools.some((tool) => tool.name === 'get_forecast'), 'get_forecast tool missing');

  const forecast = await client.callTool({
    name: 'get_forecast',
    arguments: { latitude: 48.1374, longitude: 11.5755 },
  });
  assert(textOf(forecast).includes('Temperature:'), `weather response missing temperature: ${textOf(forecast)}`);

  const resource = await client.readResource({ uri: 'weather://forecast/48.1374/11.5755' });
  assert(resource.contents.length === 1, 'weather resource did not return one content item');
});

await withClient('geocoding server', paths.geocoding, async (client) => {
  const { tools } = await client.listTools();
  assert(tools.some((tool) => tool.name === 'search_location'), 'search_location tool missing');

  const locations = await client.callTool({ name: 'search_location', arguments: { query: 'Munich' } });
  assert(textOf(locations).toLowerCase().includes('latitude:'), `geocoding response missing latitude: ${textOf(locations)}`);

  const resource = await client.readResource({ uri: 'geo://search/Munich' });
  assert(resource.contents.length === 1, 'geocoding resource did not return one content item');
});

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  process.exit(1);
}

console.log('\nAll workshop smoke checks passed.');
