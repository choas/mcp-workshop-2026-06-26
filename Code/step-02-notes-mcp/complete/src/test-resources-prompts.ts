// Test script to verify MCP resources and prompts work correctly
// This tests the same functionality as MCP Inspector would

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function runTests() {
  console.log('Starting MCP server test...\n');

  // The transport launches the server itself, so we don't spawn it manually.
  // Run with: npx tsx src/index.ts (tsx is already a dev dependency).
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['tsx', 'src/index.ts'],
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  });

  try {
    await client.connect(transport);
    console.log('✓ Connected to MCP server\n');

    // Test resources/list
    console.log('=== Testing Resources ===\n');

    const resourcesList = await client.listResources();
    console.log('Resources list:', resourcesList.resources.map(r => r.uri).join(', '));
    console.log(`✓ Found ${resourcesList.resources.length} static resources\n`);

    // Test resource templates list
    const templatesList = await client.listResourceTemplates();
    console.log('Resource templates:', templatesList.resourceTemplates.map(t => t.uriTemplate).join(', '));
    console.log(`✓ Found ${templatesList.resourceTemplates.length} resource templates\n`);

    // Test reading notes://recent
    console.log('Reading notes://recent...');
    const recentNotes = await client.readResource({ uri: 'notes://recent' });
    console.log('✓ notes://recent returned', recentNotes.contents.length, 'content item(s)\n');

    // Test reading notes://all
    console.log('Reading notes://all...');
    const allNotes = await client.readResource({ uri: 'notes://all' });
    console.log('✓ notes://all returned', allNotes.contents.length, 'content item(s)\n');

    // Test reading notes://tags/work
    console.log('Reading notes://tags/work...');
    const taggedNotes = await client.readResource({ uri: 'notes://tags/work' });
    console.log('✓ notes://tags/work returned', taggedNotes.contents.length, 'content item(s)\n');

    // Test reading notes://search/test
    console.log('Reading notes://search/test...');
    const searchedNotes = await client.readResource({ uri: 'notes://search/test' });
    console.log('✓ notes://search/test returned', searchedNotes.contents.length, 'content item(s)\n');

    // Test reading quotes://random
    console.log('Reading quotes://random...');
    const quote = await client.readResource({ uri: 'quotes://random' });
    console.log('✓ quotes://random returned', quote.contents.length, 'content item(s)\n');

    // Test prompts
    console.log('=== Testing Prompts ===\n');

    const promptsList = await client.listPrompts();
    console.log('Prompts list:', promptsList.prompts.map(p => p.name).join(', '));
    console.log(`✓ Found ${promptsList.prompts.length} prompts\n`);

    // Test daily_summary prompt
    console.log('Getting daily_summary prompt...');
    const dailySummary = await client.getPrompt({ name: 'daily_summary' });
    console.log('✓ daily_summary prompt returned', dailySummary.messages.length, 'message(s)\n');

    // Test brainstorm_ideas prompt
    console.log('Getting brainstorm_ideas prompt with topic "MCP use cases"...');
    const brainstorm = await client.getPrompt({
      name: 'brainstorm_ideas',
      arguments: { topic: 'MCP use cases' }
    });
    console.log('✓ brainstorm_ideas prompt returned', brainstorm.messages.length, 'message(s)\n');

    // Test organize_notes prompt
    console.log('Getting organize_notes prompt with tag "work"...');
    const organize = await client.getPrompt({
      name: 'organize_notes',
      arguments: { tag: 'work' }
    });
    console.log('✓ organize_notes prompt returned', organize.messages.length, 'message(s)\n');

    console.log('=== All Tests Passed! ===\n');

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    await client.close();
    process.exit(1);
  }
}

runTests();
