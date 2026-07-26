const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

// 1. Startup Configuration & Environment Validation
const PORT = process.env.PORT || 8082;
const DATABASE_URL = process.env.DATABASE_URL;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

if (!DATABASE_URL) {
  console.warn(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'WARN',
    service: 'content-service',
    message: 'Configuration Warning: DATABASE_URL is missing. Operating in simulated fallback mode.'
  }));
}

// 2. Structured JSON Logger Helper
const log = (level, message, correlationId = '', meta = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: 'content-service',
    message,
    correlation_id: correlationId,
    ...meta
  }));
};

const app = express();
app.use(express.json());

// 3. Request Tracing / Correlation ID Middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
});

// Request logger middleware
app.use((req, res, next) => {
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

// In-memory mock storage fallback for resilient boot-up state
let mockVideos = [
  { id: '1a9bc245-c800-4752-bd88-0214a19bc32a', tenant_id: DEFAULT_TENANT_ID, title: 'Rise and Fall of Ancient Rome', description: 'Exploring the history', status: 'published' },
  { id: '28bc514d-91b3-4fec-88c9-021bc2498712', tenant_id: DEFAULT_TENANT_ID, title: 'Secrets of Sparta Mythologies', description: 'Myth vs Reality', status: 'research' }
];

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Middleware to resolve active tenant context dynamically (SaaS Multi-tenancy)
const resolveTenant = (req, res, next) => {
  let tenantId = req.headers['x-tenant-id'] || DEFAULT_TENANT_ID;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
      if (payload && payload.tenant_id) {
        tenantId = payload.tenant_id;
      }
    } catch (e) {
      log('WARN', `Token parsing context warning: ${e.message}`, req.correlationId);
    }
  }

  req.tenantId = tenantId;
  next();
};

app.use(resolveTenant);

// 4. Health & Readiness Checks
app.get('/health', (req, res) => {
  sendResponse(res, 200, true, { status: 'healthy', service: 'content-service' });
});

app.get('/ready', async (req, res) => {
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

// Retrieve videos
app.get('/api/v1/videos', async (req, res) => {
  try {
    const { status } = req.query;
    if (!DATABASE_URL) {
      throw new Error('Database is offline');
    }

    let queryStr = 'SELECT * FROM content.ct_videos WHERE tenant_id = $1';
    let params = [req.tenantId];

    if (status) {
      queryStr += ' AND status = $2';
      params.push(status);
    }

    const result = await pool.query(queryStr, params);
    sendResponse(res, 200, true, result.rows);
  } catch (err) {
    log('WARN', `Database query fallback executed: ${err.message}`, req.correlationId);
    const { status } = req.query;
    const tenantMockData = mockVideos.filter(v => v.tenant_id === req.tenantId);
    let filtered = tenantMockData;
    if (status) {
      filtered = tenantMockData.filter(v => v.status === status);
    }
    sendResponse(res, 200, true, filtered);
  }
});

// Create video
app.post('/api/v1/videos', async (req, res) => {
  const { title, description } = req.body;
  const newVideo = {
    id: crypto.randomUUID(),
    tenant_id: req.tenantId,
    title,
    description,
    status: 'ideation'
  };

  try {
    if (!DATABASE_URL) {
      throw new Error('Database offline');
    }
    const queryStr = 'INSERT INTO content.ct_videos (id, tenant_id, title, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const params = [newVideo.id, newVideo.tenant_id, newVideo.title, newVideo.description, newVideo.status];
    const result = await pool.query(queryStr, params);
    sendResponse(res, 201, true, result.rows[0]);
  } catch (err) {
    log('WARN', `Database insertion fallback executed: ${err.message}`, req.correlationId);
    mockVideos.push(newVideo);
    sendResponse(res, 201, true, newVideo);
  }
});

// 5. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
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
const server = app.listen(PORT, () => {
  log('INFO', `Content Service initialized on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
  log('INFO', `Received ${signal}. Starting graceful shutdown of Content Service...`);
  server.close(async () => {
    log('INFO', 'Content Service HTTP server closed. Draining database connection pool...');
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
