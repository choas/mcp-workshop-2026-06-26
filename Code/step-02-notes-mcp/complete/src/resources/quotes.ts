// Quote resources for MCP server
// Per MCP_IMPLEMENTATION_CONCEPT.md resources/quotes.ts section

import type { Resource } from '@modelcontextprotocol/sdk/types.js';
import { getRandomQuote } from '../external-apis.js';

// Static resource for random quote
export const quoteResources: Resource[] = [
  {
    uri: 'quotes://random',
    name: 'Random Quote',
    description: 'A random inspirational quote',
    mimeType: 'application/json',
  },
];

/**
 * Read a quote resource by URI
 */
export async function readQuoteResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
  if (uri !== 'quotes://random') {
    throw new Error(`Unknown quote resource URI: ${uri}`);
  }

  try {
    const quote = await getRandomQuote();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(quote, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
    };
  }
}
