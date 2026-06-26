// step-05: A minimal MCP client — no LLM, just the protocol.
//
// This is the equivalent of MCP Inspector in a handful of lines. It launches
// the completed Notes MCP server (step-02) as a subprocess, completes the
// handshake, lists what it offers, calls a tool, and reads a resource.
//
// Set DEBUG=1 to print every raw JSON-RPC frame that crosses the wire — proof
// that "the MCP protocol" is just request/response JSON over a pipe.
//
//   npm run client
//   DEBUG=1 npm run client

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

// The transport spawns the server process and speaks stdio to it.
// Point it at the completed Notes MCP server from step-02.
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['tsx', '../step-02-notes-mcp/complete/src/index.ts'],
});

// --- Optional: see the raw messages (Step 2 in the appendix) -----------------
// The SDK generates JSON-RPC frames, matches ids, and hands you the result.
// Wrap send()/onmessage to peek at them. Enable with DEBUG=1.
if (process.env.DEBUG) {
  const originalSend = transport.send.bind(transport);
  transport.send = (message: JSONRPCMessage) => {
    console.error('→ SENT    ', JSON.stringify(message));
    return originalSend(message);
  };
  // onmessage is assigned by Client.connect(); patch it after connect below.
}

const client = new Client({ name: 'my-cli-client', version: '1.0.0' });

// connect() performs the initialize handshake for you.
await client.connect(transport);

if (process.env.DEBUG) {
  const originalOnMessage = transport.onmessage?.bind(transport);
  transport.onmessage = (message) => {
    console.error('← RECEIVED', JSON.stringify(message));
    originalOnMessage?.(message);
  };
}

// --- Discovery ---------------------------------------------------------------
const { tools } = await client.listTools();
console.log('Tools:    ', tools.map((t) => t.name).join(', ') || '(none)');

const { resources } = await client.listResources();
console.log('Resources:', resources.map((r) => r.uri).join(', ') || '(none)');

const { prompts } = await client.listPrompts();
console.log('Prompts:  ', prompts.map((p) => p.name).join(', ') || '(none)');

// --- Execution ---------------------------------------------------------------
console.log('\nCalling add_note...');
const result = await client.callTool({
  name: 'add_note',
  // Note: this server's schema wants `tags` as a string array (see tools/list
  // output), not the comma-string the appendix shows. Match the real schema.
  arguments: { content: 'Built my own MCP client!', tags: ['workshop', 'mcp'] },
});
console.log('Result:', JSON.stringify(result.content, null, 2));

// --- Read a resource ---------------------------------------------------------
if (resources.length > 0) {
  const uri = resources[0].uri;
  console.log(`\nReading resource ${uri}...`);
  const res = await client.readResource({ uri });
  console.log('Contents:', JSON.stringify(res.contents, null, 2));
}

await client.close();
