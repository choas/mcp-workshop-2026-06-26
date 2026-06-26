// step-05: Add an LLM → a tiny agent.
//
// A client without an LLM is a remote control. Add an LLM and the *model*
// decides which tool to call — which is exactly what a host (Claude Desktop,
// Cursor) does. The loop is:
//
//   1. Send the user's message + the MCP tool list to the LLM.
//   2. If the LLM responds with a tool call, run it via client.callTool().
//   3. Feed the tool result back to the LLM.
//   4. Repeat until the LLM answers in plain language.
//
// Requires an API key:
//   export ANTHROPIC_API_KEY=sk-ant-...
//   npm run agent -- "Add a note about the workshop, then list my notes"
//
// For the workshop's hosted gateway, set ANTHROPIC_BASE_URL to the LiteLLM
// gateway URL (the Anthropic SDK reads it automatically).

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, Tool } from '@anthropic-ai/sdk/resources/messages';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const MODEL = 'claude-opus-4-8';
const userMessage =
  process.argv.slice(2).join(' ').trim() ||
  'Add a note about the VibeKode MCP workshop, then list my notes.';

// --- Connect to the MCP server ----------------------------------------------
const transport = new StdioClientTransport({
  command: 'npx',
  args: ['tsx', '../step-02-notes-mcp/complete/src/index.ts'],
});
const client = new Client({ name: 'my-agent-client', version: '1.0.0' });
await client.connect(transport);

// 1. Translate MCP tools → the LLM's tool format.
const { tools } = await client.listTools();
const llmTools: Tool[] = tools.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: t.inputSchema as Tool.InputSchema,
}));
console.error(`[mcp] exposing ${llmTools.length} tools to the model`);

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY (+ ANTHROPIC_BASE_URL)

const messages: MessageParam[] = [{ role: 'user', content: userMessage }];

// 2-4. Agent loop: let the model pick tools, run them, feed results back.
while (true) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    tools: llmTools,
    messages,
  });

  // Print any text the model produced this turn.
  for (const block of response.content) {
    if (block.type === 'text' && block.text.trim()) {
      console.log(`\n🤖 ${block.text.trim()}`);
    }
  }

  messages.push({ role: 'assistant', content: response.content });

  // If the model is done (no tool calls), stop.
  if (response.stop_reason !== 'tool_use') break;

  // Run every requested tool call through MCP and collect the results.
  const toolResults: Anthropic.ToolResultBlockParam[] = [];
  for (const block of response.content) {
    if (block.type !== 'tool_use') continue;
    console.error(`[mcp] calling ${block.name}(${JSON.stringify(block.input)})`);

    const result = await client.callTool({
      name: block.name,
      arguments: block.input as Record<string, unknown>,
    });

    toolResults.push({
      type: 'tool_result',
      tool_use_id: block.id,
      content: result.content as Anthropic.ToolResultBlockParam['content'],
    });
  }

  messages.push({ role: 'user', content: toolResults });
}

await client.close();
