// External API interfaces and fetchers
// Per MCP_IMPLEMENTATION_CONCEPT.md external-apis.ts section

export interface Quote {
  content: string;
  author: string;
}

// Fallback quotes when quotable.io is unreachable
const FALLBACK_QUOTES: Quote[] = [
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { content: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { content: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { content: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
];

/**
 * Fetch a random inspirational quote from api.quotable.io
 * Falls back to local quotes when external API is unreachable
 * @returns Quote object with content and author
 */
export async function getRandomQuote(): Promise<Quote> {
  try {
    const response = await fetch('https://api.quotable.io/random');

    if (!response.ok) {
      throw new Error(`Quote API error: ${response.status}`);
    }

    const data = await response.json() as { content: string; author: string };

    // Validate response structure
    if (!data.content || !data.author) {
      throw new Error('Invalid quote API response structure');
    }

    return {
      content: data.content,
      author: data.author
    };
  } catch {
    // Use fallback when external API is unreachable
    const randomIndex = Math.floor(Math.random() * FALLBACK_QUOTES.length);
    return FALLBACK_QUOTES[randomIndex];
  }
}
