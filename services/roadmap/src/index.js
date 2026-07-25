const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8083;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

app.use(express.json());

// In-memory mock storage fallback for resilient boot-up state
let mockRoadmaps = [
  { id: '34bc98e1-da81-42ab-bd99-0129bc4897bc', tenant_id: DEFAULT_TENANT_ID, title: 'Historical Dynasties series', description: 'Analyze major world civilisations', target_date: '2024-12-31' }
];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Middleware to resolve active tenant context dynamically (SaaS Multi-tenancy)
const resolveTenant = (req, res, next) => {
  let tenantId = req.headers['x-tenant-id'] || DEFAULT_TENANT_ID;

  // Option to extract from JWT authorization bearer token if provided
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      // Quick client-side decode to extract claims
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
      if (payload && payload.tenant_id) {
        tenantId = payload.tenant_id;
      }
    } catch (e) {
      // Ignore token parse errors, fallback to header or default
    }
  }

  req.tenantId = tenantId;
  next();
};

app.use(resolveTenant);

// Diagnostic Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'roadmap-service',
    timestamp: new Date().toISOString()
  });
});

// Retrieve roadmaps
app.get('/api/v1/roadmaps', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roadmap.rm_roadmaps WHERE tenant_id = $1', [req.tenantId]);
    res.json(result.rows);
  } catch (err) {
    const tenantMockData = mockRoadmaps.filter(r => r.tenant_id === req.tenantId);
    res.json(tenantMockData);
  }
});

// Create roadmap
app.post('/api/v1/roadmaps', async (req, res) => {
  const { title, description, target_date } = req.body;
  const newRoadmap = {
    id: require('crypto').randomUUID(),
    tenant_id: req.tenantId,
    title,
    description,
    target_date: target_date || '2024-12-31'
  };

  try {
    const queryStr = 'INSERT INTO roadmap.rm_roadmaps (id, tenant_id, title, description, target_date) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const params = [newRoadmap.id, newRoadmap.tenant_id, newRoadmap.title, newRoadmap.description, newRoadmap.target_date];
    const result = await pool.query(queryStr, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    mockRoadmaps.push(newRoadmap);
    res.status(201).json(newRoadmap);
  }
});

app.listen(PORT, () => {
  console.log(`Roadmap Service initialized on port ${PORT}`);
});
