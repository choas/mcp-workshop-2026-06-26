# Phase 4: Adding Prompts

## Goal
Add prompts - reusable templates for common LLM interactions.

## What are Prompts?

Prompts are pre-defined templates that:
- Combine data from resources with structured instructions
- Save time on repetitive tasks
- Ensure consistent interactions

## Vibe Coding Prompts

### Step 1: Add daily_summary prompt
> "Add an MCP prompt called 'daily_summary' that fetches recent notes
> and creates a prompt asking the LLM to summarize them.
> Use ListPromptsRequestSchema and GetPromptRequestSchema."

### Step 2: Add brainstorm_ideas prompt
> "Add a 'brainstorm_ideas' prompt with a required 'topic' argument.
> It should search for related notes and create a structured brainstorming prompt."

### Step 3: Add organize_notes prompt
> "Add an 'organize_notes' prompt with an optional 'tag' argument.
> It should analyze notes and ask the LLM to suggest better organization."

## Prerequisites

This MCP server shares the database with step-01-notes-app.
More notes = better prompt results!

## Test with MCP Inspector

```bash
npm install
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```

Check:
1. Prompts tab shows all three prompts
2. Click 'daily_summary' to see the generated prompt
3. Try 'brainstorm_ideas' with topic "productivity"
4. Try 'organize_notes' with and without a tag

## Congratulations!

You've built a complete MCP server with:
- **Tools**: Actions the LLM can execute
- **Resources**: Read-only data access
- **Prompts**: Reusable interaction templates

Check the `complete/` folder for the full implementation with external APIs.
