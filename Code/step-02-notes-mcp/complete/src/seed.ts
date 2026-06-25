import { initDatabase, addNote, listNotes, searchNotes } from './database.js';

// Sample data from MCP_IMPLEMENTATION_CONCEPT.md
const sampleNotes = [
  { content: 'Remember to prepare MCP demo for conference', tags: ['work', 'mcp', 'demo'] },
  { content: 'Idea: Build a recipe MCP server', tags: ['idea', 'mcp'] },
  { content: 'Meeting notes from team sync', tags: ['work', 'meeting'] },
  { content: 'Read about JSON-RPC 2.0 specification', tags: ['learning', 'mcp'] },
  { content: 'Buy groceries: milk, bread, eggs', tags: ['personal', 'todo'] },
];

async function seed() {
  console.log('Initializing database...');
  const db = initDatabase();

  // Check if notes already exist
  const existingNotes = listNotes(db, 100);
  if (existingNotes.length > 0) {
    console.log(`Database already contains ${existingNotes.length} note(s).`);
    console.log('Existing notes:');
    existingNotes.forEach(note => {
      console.log(`  [${note.id}] ${note.content} (tags: ${note.tags || 'none'})`);
    });
    console.log('\nSkipping seed to avoid duplicates. Delete data/notes.db to reset.');
    db.close();
    return;
  }

  console.log('Inserting sample notes...');
  for (const note of sampleNotes) {
    const created = addNote(db, note.content, note.tags);
    console.log(`  Created note [${created.id}]: ${created.content}`);
  }

  console.log('\nVerifying with list_notes...');
  const allNotes = listNotes(db, 10);
  console.log(`Found ${allNotes.length} notes:`);
  allNotes.forEach(note => {
    console.log(`  [${note.id}] ${note.content} (tags: ${note.tags || 'none'})`);
  });

  console.log('\nVerifying with search_notes (query: "MCP")...');
  const mcpNotes = searchNotes(db, 'MCP');
  console.log(`Found ${mcpNotes.length} notes matching "MCP":`);
  mcpNotes.forEach(note => {
    console.log(`  [${note.id}] ${note.content}`);
  });

  console.log('\nSeed completed successfully!');
  db.close();
}

seed().catch(console.error);
