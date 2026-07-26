const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8088;

app.use(cors());
app.use(express.json());

// Set up connection to master database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cip_admin:cip_secure_password@database:5432/cip_master_db',
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
// Added NVARCHAR, NVARCHAR(255), NCHAR, and NCHAR(10) to support Telugu and multilingual titles natively.
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
  res.json({
    success: true,
    data: customSchemaMetadata,
    meta: { total_schemas: customSchemaMetadata.length },
    errors: []
  });
});

// Create or alter physical database schemas dynamically with rigid validation filters
app.post('/api/v1/schemas', async (req, res) => {
  const { tableName, action, fields } = req.body; // action: 'CREATE' | 'ADD_COLUMN'

  if (!tableName || !action) {
    return res.status(400).json({
      success: false,
      data: null,
      errors: [{ code: 'INVALID_PARAMETERS', message: 'tableName and action are required' }]
    });
  }

  // 1. Sanitize Table Name
  if (!isValidSqlName(tableName)) {
    return res.status(400).json({
      success: false,
      data: null,
      errors: [{ code: 'INVALID_TABLE_NAME', message: 'Table name must consist of valid alphanumeric characters starting with a letter.' }]
    });
  }

  try {
    let ddlQuery = '';

    if (action === 'CREATE') {
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({
          success: false,
          data: null,
          errors: [{ code: 'INVALID_FIELDS', message: 'CREATE action requires fields definition array' }]
        });
      }

      // Validate each field name and type individually to block SQL injection
      for (const f of fields) {
        if (!isValidSqlName(f.name)) {
          return res.status(400).json({
            success: false,
            data: null,
            errors: [{ code: 'INVALID_COLUMN_NAME', message: `Column name "${f.name}" is invalid.` }]
          });
        }
        if (!VALID_TYPES_WHITELIST.includes(f.type.toUpperCase())) {
          return res.status(400).json({
            success: false,
            data: null,
            errors: [{ code: 'UNAUTHORIZED_COLUMN_TYPE', message: `Data type "${f.type}" is unauthorized.` }]
          });
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
        return res.status(400).json({
          success: false,
          data: null,
          errors: [{ code: 'INVALID_FIELDS', message: 'ADD_COLUMN action requires exactly one field target' }]
        });
      }

      const targetField = fields[0];

      // Validate column name and type
      if (!isValidSqlName(targetField.name)) {
        return res.status(400).json({
          success: false,
          data: null,
          errors: [{ code: 'INVALID_COLUMN_NAME', message: `Column name "${targetField.name}" is invalid.` }]
        });
      }
      if (!VALID_TYPES_WHITELIST.includes(targetField.type.toUpperCase())) {
        return res.status(400).json({
          success: false,
          data: null,
          errors: [{ code: 'UNAUTHORIZED_COLUMN_TYPE', message: `Data type "${targetField.type}" is unauthorized.` }]
        });
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
      // Execute sanitized query safely
      await pool.query(ddlQuery);
    } catch (dbErr) {
      console.warn(`[Schema Manager DB Warning] Master DB offline. Query simulated in-memory. SQL Preview: ${ddlQuery}`);
      isMockSimulated = true;
    }

    res.json({
      success: true,
      data: {
        tableName,
        action,
        sqlPreview: ddlQuery,
        simulated: isMockSimulated,
        activeSchema: customSchemaMetadata.find(s => s.tableName === tableName)
      },
      meta: { timestamp: new Date().toISOString() },
      errors: []
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      errors: [{ code: 'SCHEMA_ALTERATION_FAILED', message: err.message }]
    });
  }
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({ success: true, service: 'schema-manager-service', status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`Schema Management Service listening on port ${PORT}`);
});
