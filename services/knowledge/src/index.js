const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

// 1. Startup Configuration & Environment Validation
const PORT = process.env.PORT || 8084;
const DATABASE_URL = process.env.DATABASE_URL;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

if (!DATABASE_URL) {
  console.warn(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'WARN',
    service: 'knowledge-service',
    message: 'Configuration Warning: DATABASE_URL is missing. Operating in simulated fallback mode.'
  }));
}

// 2. Structured JSON Logger Helper
const log = (level, message, correlationId = '', meta = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: 'knowledge-service',
    message,
    correlation_id: correlationId,
    ...meta
  }));
};

const expressApp = express();
expressApp.use(express.json());

// 3. Request Tracing / Correlation ID Middleware
expressApp.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
});

// Request logger middleware
expressApp.use((req, res, next) => {
  log('INFO', `Incoming Request: ${req.method} ${req.url}`, req.correlationId);
  next();
});

// Standardized Response Helper
const sendResponse = (res, statusCode, success, data = null, meta = {}, errors = []) => {
  res.status(statusCode).json({
    success,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
      correlation_id: res.get('X-Correlation-Id')
    },
    errors
  });
};

// Resilient memory fallbacks for citation notes
let mockBooks = [
  { id: '1001-abc-9923', tenant_id: DEFAULT_TENANT_ID, title: 'The Histories of Herodotus', author: 'Herodotus', isbn: '978-0199535668' },
  { id: '1002-xyz-4412', tenant_id: DEFAULT_TENANT_ID, title: 'The History of the Peloponnesian War', author: 'Thucydides', isbn: '978-0140440393' }
];

let mockNotes = [
  { id: 'n1', tenant_id: DEFAULT_TENANT_ID, book_id: '1001-abc-9923', title: 'Thermopylae passage', raw_content: 'Herodotus detail regarding 300 Spartans holding the hot gates.', tag_entities: ['Sparta', 'Greece'] }
];

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// 4. Health & Readiness Checks
expressApp.get('/health', (req, res) => {
  sendResponse(res, 200, true, { status: 'healthy', service: 'knowledge-service' });
});

expressApp.get('/ready', async (req, res) => {
  try {
    if (!DATABASE_URL) {
      throw new Error('Database not configured');
    }
    await pool.query('SELECT 1');
    sendResponse(res, 200, true, { status: 'ready', database: 'connected' });
  } catch (err) {
    log('WARN', `Readiness Probe Warning: ${err.message}. Returning degraded standby state.`, req.correlationId);
    sendResponse(res, 200, true, { status: 'degraded', database: 'disconnected', fallback: 'active' });
  }
});

// Books lookup
expressApp.get('/api/v1/library/books', async (req, res) => {
  try {
    if (!DATABASE_URL) {
      throw new Error('Database offline');
    }
    const result = await pool.query('SELECT * FROM knowledge.kn_books WHERE tenant_id = $1', [DEFAULT_TENANT_ID]);
    sendResponse(res, 200, true, result.rows);
  } catch (err) {
    log('WARN', `Database query fallback executed: ${err.message}`, req.correlationId);
    sendResponse(res, 200, true, mockBooks);
  }
});

// Register book
expressApp.post('/api/v1/library/books', async (req, res) => {
  const { title, author, isbn } = req.body;
  const newBook = {
    id: crypto.randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    title,
    author,
    isbn
  };

  try {
    if (!DATABASE_URL) {
      throw new Error('Database offline');
    }
    const queryStr = 'INSERT INTO knowledge.kn_books (id, tenant_id, title, author, isbn) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const params = [newBook.id, newBook.tenant_id, newBook.title, newBook.author, newBook.isbn];
    const result = await pool.query(queryStr, params);
    sendResponse(res, 201, true, result.rows[0]);
  } catch (err) {
    log('WARN', `Database insertion fallback executed: ${err.message}`, req.correlationId);
    mockBooks.push(newBook);
    sendResponse(res, 201, true, newBook);
  }
});

// Research Notes query
expressApp.get('/api/v1/library/notes', async (req, res) => {
  try {
    if (!DATABASE_URL) {
      throw new Error('Database offline');
    }
    const result = await pool.query('SELECT * FROM knowledge.kn_research_items WHERE tenant_id = $1', [DEFAULT_TENANT_ID]);
    sendResponse(res, 200, true, result.rows);
  } catch (err) {
    log('WARN', `Database query fallback executed: ${err.message}`, req.correlationId);
    sendResponse(res, 200, true, mockNotes);
  }
});

// Register Research Note
expressApp.post('/api/v1/library/notes', async (req, res) => {
  const { book_id, title, raw_content, tag_entities } = req.body;
  const newNote = {
    id: crypto.randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    book_id,
    title,
    raw_content,
    tag_entities: tag_entities || []
  };

  try {
    if (!DATABASE_URL) {
      throw new Error('Database offline');
    }
    const queryStr = 'INSERT INTO knowledge.kn_research_items (id, tenant_id, book_id, title, raw_content, tag_entities) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const params = [newNote.id, newNote.tenant_id, newNote.book_id, newNote.title, newNote.raw_content, newNote.tag_entities];
    const result = await pool.query(queryStr, params);
    sendResponse(res, 201, true, result.rows[0]);
  } catch (err) {
    log('WARN', `Database insertion fallback executed: ${err.message}`, req.correlationId);
    mockNotes.push(newNote);
    sendResponse(res, 201, true, newNote);
  }
});

// 5. Centralized Error Handling Middleware
expressApp.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const errCode = err.code || 'INTERNAL_SERVER_ERROR';
  const errMessage = err.message || 'An unexpected error occurred';

  log('ERROR', `Error processing request: ${errMessage}`, req.correlationId, { stack: err.stack });

  sendResponse(res, statusCode, false, null, {}, [{
    code: errCode,
    message: errMessage,
    field: err.field || null
  }]);
});

// 6. Graceful Shutdown
const server = expressApp.listen(PORT, () => {
  log('INFO', `Knowledge Service initialized on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
  log('INFO', `Received ${signal}. Starting graceful shutdown of Knowledge Service...`);
  server.close(async () => {
    log('INFO', 'Knowledge Service HTTP server closed. Draining database connection pool...');
    try {
      await pool.end();
      log('INFO', 'Postgres pool successfully terminated. Process exiting.');
      process.exit(0);
    } catch (dbErr) {
      log('ERROR', `Error terminating Postgres connection pool: ${dbErr.message}`, '', { error: dbErr });
      process.exit(1);
    }
  });

  setTimeout(() => {
    log('WARN', 'Forced shutdown triggered after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
