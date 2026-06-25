// Notes App - Frontend JavaScript

const API_BASE = '/notes';

// DOM Elements
const addNoteForm = document.getElementById('add-note-form');
const noteContent = document.getElementById('note-content');
const noteTags = document.getElementById('note-tags');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');
const notesContainer = document.getElementById('notes-container');
const notesCount = document.getElementById('notes-count');

// Fetch and display notes
async function loadNotes() {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error('Failed to load notes');
    const notes = await response.json();
    renderNotes(notes);
  } catch (error) {
    showError(error.message);
  }
}

// Add a new note
async function addNote(content, tags) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add note');
    }

    loadNotes();
    return true;
  } catch (error) {
    showError(error.message);
    return false;
  }
}

// Delete a note
async function deleteNote(id) {
  if (!confirm('Delete this note?')) return;

  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 204) {
      throw new Error('Failed to delete note');
    }

    loadNotes();
  } catch (error) {
    showError(error.message);
  }
}

// Search notes
async function searchNotes(query) {
  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Search failed');
    const notes = await response.json();
    renderNotes(notes, `Search results for "${query}"`);
  } catch (error) {
    showError(error.message);
  }
}

// Render notes to the DOM
function renderNotes(notes, title = null) {
  notesCount.textContent = `(${notes.length})`;

  if (notes.length === 0) {
    notesContainer.innerHTML = '<p class="empty">No notes found. Add your first note above!</p>';
    return;
  }

  notesContainer.innerHTML = notes.map(note => `
    <div class="note-card">
      <p class="note-content">${escapeHtml(note.content)}</p>
      <div class="note-meta">
        <div class="note-tags">
          ${note.tags.length > 0
            ? note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
            : '<span class="tag" style="background:#eee;color:#999">no tags</span>'
          }
        </div>
        <span class="note-date">${formatDate(note.created_at)}</span>
      </div>
      <div class="note-actions">
        <button class="btn btn-danger" onclick="deleteNote(${note.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// Show error message
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.textContent = message;
  notesContainer.prepend(errorDiv);
  setTimeout(() => errorDiv.remove(), 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Event Listeners
addNoteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = noteContent.value.trim();
  const tags = noteTags.value.trim();

  if (content) {
    const success = await addNote(content, tags);
    if (success) {
      noteContent.value = '';
      noteTags.value = '';
    }
  }
});

searchBtn.addEventListener('click', () => {
  const query = searchInput.value.trim();
  if (query) {
    searchNotes(query);
  }
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  loadNotes();
});

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchBtn.click();
  }
});

// Initial load
loadNotes();
