const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const crypto = require('crypto');

// 1. Startup Configuration & Environment Validation
const PORT = process.env.PORT || 8088;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'WARN',
    service: 'schema-manager-service',
    message: 'Configuration Warning: DATABASE_URL is missing. Operating in simulated fallback mode.'
  }));
}

// 2. Structured JSON Logger Helper
const log = (level, message, correlationId = '', meta = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: 'schema-manager-service',
    message,
    correlation_id: correlationId,
    ...meta
  }));
};

const app = express();
app.use(cors());
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

// Set up connection to master database
const pool = new Pool({
  connectionString: DATABASE_URL || 'postgresql://cip_admin:cip_secure_password@database:5432/cip_master_db',
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Seed schema registry
let customSchemaMetadata = [
  {
    tableName: 'custom_youtube_leads',
    fields: [
      { name: 'id', type: 'UUID', primary: true },
      { name: 'lead_name', type: 'VARCHAR(255)' },
      { name: 'email', type: 'VARCHAR(255)' },
      { name: 'channel_size', type: 'INTEGER' }
    ]
  },
  {
    tableName: 'custom_content_briefs',
    fields: [
      { name: 'id', type: 'UUID', primary: true },
      { name: 'brief_title', type: 'VARCHAR(255)' },
      { name: 'target_duration', type: 'INTEGER' },
      { name: 'approved', type: 'BOOLEAN' }
    ]
  }
];

// Whitelist of valid data types to completely avoid SQL injection vectors
const VALID_TYPES_WHITELIST = [
  'VARCHAR(255)',
  'INTEGER',
  'BOOLEAN',
  'TIMESTAMP',
  'TEXT',
  'UUID',
  'NVARCHAR',
  'NVARCHAR(255)',
  'NCHAR',
  'NCHAR(10)'
];

// Sanitize strings to contain only safe alphanumeric characters and underscores
const isValidSqlName = (str) => {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(str);
};

// List current active custom schemas
app.get('/api/v1/schemas', (req, res) => {
  sendResponse(res, 200, true, customSchemaMetadata);
});

// Create or alter physical database schemas dynamically with rigid validation filters
app.post('/api/v1/schemas', async (req, res) => {
  const { tableName, action, fields } = req.body; // action: 'CREATE' | 'ADD_COLUMN'

  if (!tableName || !action) {
    return sendResponse(res, 400, false, null, {}, [{ code: 'INVALID_PARAMETERS', message: 'tableName and action are required' }]);
  }

  // 1. Sanitize Table Name
  if (!isValidSqlName(tableName)) {
    return sendResponse(res, 400, false, null, {}, [{ code: 'INVALID_TABLE_NAME', message: 'Table name must consist of valid alphanumeric characters starting with a letter.' }]);
  }

  try {
    let ddlQuery = '';

    if (action === 'CREATE') {
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return sendResponse(res, 400, false, null, {}, [{ code: 'INVALID_FIELDS', message: 'CREATE action requires fields definition array' }]);
      }

      // Validate each field name and type individually to block SQL injection
      for (const f of fields) {
        if (!isValidSqlName(f.name)) {
          return sendResponse(res, 400, false, null, {}, [{ code: 'INVALID_COLUMN_NAME', message: `Column name "${f.name}" is invalid.` }]);
        }
        if (!VALID_TYPES_WHITELIST.includes(f.type.toUpperCase())) {
          return sendResponse(res, 400, false, null, {}, [{ code: 'UNAUTHORIZED_COLUMN_TYPE', message: `Data type "${f.type}" is unauthorized.` }]);
        }
      }

      const columnDefs = fields.map(f => {
        let def = `${f.name} ${f.type.toUpperCase()}`;
        if (f.primary) def += ' PRIMARY KEY';
        return def;
      }).join(', ');

      ddlQuery = `CREATE TABLE IF NOT EXISTS public.${tableName} (${columnDefs});`;

      // Update in-memory metadata registry
      const existing = customSchemaMetadata.find(s => s.tableName === tableName);
      if (!existing) {
        customSchemaMetadata.push({ tableName, fields });
      }
    }
    else if (action === 'ADD_COLUMN') {
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return sendResponse(res, 400, false, null, {}, [{ code: 'INVALID_FIELDS', message: 'ADD_COLUMN action requires exactly one field target' }]);
      }

      const targetField = fields[0];

      // Validate column name and type
      if (!isValidSqlName(targetField.name)) {
        return sendResponse(res, 400, false, null, {}, [{ code: 'INVALID_COLUMN_NAME', message: `Column name "${targetField.name}" is invalid.` }]);
      }
      if (!VALID_TYPES_WHITELIST.includes(targetField.type.toUpperCase())) {
        return sendResponse(res, 400, false, null, {}, [{ code: 'UNAUTHORIZED_COLUMN_TYPE', message: `Data type "${targetField.type}" is unauthorized.` }]);
      }

      ddlQuery = `ALTER TABLE public.${tableName} ADD COLUMN IF NOT EXISTS ${targetField.name} ${targetField.type.toUpperCase()};`;

      // Update in-memory metadata registry
      const existing = customSchemaMetadata.find(s => s.tableName === tableName);
      if (existing) {
        const fieldExists = existing.fields.some(f => f.name === targetField.name);
        if (!fieldExists) {
          existing.fields.push(targetField);
        }
      } else {
        customSchemaMetadata.push({ tableName, fields });
      }
    }

    let isMockSimulated = false;
    try {
      if (!DATABASE_URL) {
        throw new Error('Database connection offline');
      }
      // Execute sanitized query safely
      await pool.query(ddlQuery);
    } catch (dbErr) {
      log('WARN', `Master DB offline. Query simulated in-memory. SQL Preview: ${ddlQuery}`, req.correlationId);
      isMockSimulated = true;
    }

    sendResponse(res, 200, true, {
      tableName,
      action,
      sqlPreview: ddlQuery,
      simulated: isMockSimulated,
      activeSchema: customSchemaMetadata.find(s => s.tableName === tableName)
    });

  } catch (err) {
    sendResponse(res, 500, false, null, {}, [{ code: 'SCHEMA_ALTERATION_FAILED', message: err.message }]);
  }
});

// 4. Health & Readiness Checks
app.get('/health', (req, res) => {
  sendResponse(res, 200, true, { success: true, service: 'schema-manager-service', status: 'healthy' });
});

app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    sendResponse(res, 200, true, { status: 'ready', database: 'connected' });
  } catch (err) {
    log('WARN', `Readiness Probe Warning: ${err.message}. Returning degraded standby state.`, req.correlationId);
    sendResponse(res, 200, true, { status: 'degraded', database: 'disconnected', fallback: 'active' });
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
  log('INFO', `Schema Management Service listening on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
  log('INFO', `Received ${signal}. Starting graceful shutdown of Schema Management Service...`);
  server.close(async () => {
    log('INFO', 'Schema Management Service HTTP server closed. Draining database connection pool...');
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
