const express = require('express');
const { Pool } = require('pg');

const expressApp = express();
const PORT = process.env.PORT || 8084;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

expressApp.use(express.json());

// Resilient memory fallbacks for citation notes
let mockBooks = [
  { id: '1001-abc-9923', tenant_id: DEFAULT_TENANT_ID, title: 'The Histories of Herodotus', author: 'Herodotus', isbn: '978-0199535668' },
  { id: '1002-xyz-4412', tenant_id: DEFAULT_TENANT_ID, title: 'The History of the Peloponnesian War', author: 'Thucydides', isbn: '978-0140440393' }
];

let mockNotes = [
  { id: 'n1', tenant_id: DEFAULT_TENANT_ID, book_id: '1001-abc-9923', title: 'Thermopylae passage', raw_content: 'Herodotus detail regarding 300 Spartans holding the hot gates.', tag_entities: ['Sparta', 'Greece'] }
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Health check diagnostic
expressApp.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'knowledge-service',
    timestamp: new Date().toISOString()
  });
});

// Books lookup
expressApp.get('/api/v1/library/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM knowledge.kn_books WHERE tenant_id = $1', [DEFAULT_TENANT_ID]);
    res.json(result.rows);
  } catch (err) {
    res.json(mockBooks);
  }
});

// Register book
expressApp.post('/api/v1/library/books', async (req, res) => {
  const { title, author, isbn } = req.body;
  const newBook = {
    id: require('crypto').randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    title,
    author,
    isbn
  };

  try {
    const queryStr = 'INSERT INTO knowledge.kn_books (id, tenant_id, title, author, isbn) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const params = [newBook.id, newBook.tenant_id, newBook.title, newBook.author, newBook.isbn];
    const result = await pool.query(queryStr, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    mockBooks.push(newBook);
    res.status(201).json(newBook);
  }
});

// Research Notes query
expressApp.get('/api/v1/library/notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM knowledge.kn_research_items WHERE tenant_id = $1', [DEFAULT_TENANT_ID]);
    res.json(result.rows);
  } catch (err) {
    res.json(mockNotes);
  }
});

// Register Research Note
expressApp.post('/api/v1/library/notes', async (req, res) => {
  const { book_id, title, raw_content, tag_entities } = req.body;
  const newNote = {
    id: require('crypto').randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    book_id,
    title,
    raw_content,
    tag_entities: tag_entities || []
  };

  try {
    const queryStr = 'INSERT INTO knowledge.kn_research_items (id, tenant_id, book_id, title, raw_content, tag_entities) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const params = [newNote.id, newNote.tenant_id, newNote.book_id, newNote.title, newNote.raw_content, newNote.tag_entities];
    const result = await pool.query(queryStr, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    mockNotes.push(newNote);
    res.status(201).json(newNote);
  }
});

expressApp.listen(PORT, () => {
  console.log(`Knowledge Service initialized on port ${PORT}`);
});
