const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8082;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

app.use(express.json());

// In-memory mock storage fallback for resilient boot-up state
let mockVideos = [
  { id: '1a9bc245-c800-4752-bd88-0214a19bc32a', tenant_id: DEFAULT_TENANT_ID, title: 'Rise and Fall of Ancient Rome', description: 'Exploring the history', status: 'published' },
  { id: '28bc514d-91b3-4fec-88c9-021bc2498712', tenant_id: DEFAULT_TENANT_ID, title: 'Secrets of Sparta Mythologies', description: 'Myth vs Reality', status: 'research' }
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

// Diagnostic Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'content-service',
    timestamp: new Date().toISOString()
  });
});

// Retrieve videos
app.get('/api/v1/videos', async (req, res) => {
  try {
    const { status } = req.query;
    let queryStr = 'SELECT * FROM content.ct_videos WHERE tenant_id = $1';
    let params = [req.tenantId];

    if (status) {
      queryStr += ' AND status = $2';
      params.push(status);
    }

    const result = await pool.query(queryStr, params);
    res.json(result.rows);
  } catch (err) {
    // Return mock fallback resilient state if DB not populated yet
    const { status } = req.query;
    // Filter mock data based on active tenant
    const tenantMockData = mockVideos.filter(v => v.tenant_id === req.tenantId);
    let filtered = tenantMockData;
    if (status) {
      filtered = tenantMockData.filter(v => v.status === status);
    }
    res.json(filtered);
  }
});

// Create video
app.post('/api/v1/videos', async (req, res) => {
  const { title, description } = req.body;
  const newVideo = {
    id: require('crypto').randomUUID(),
    tenant_id: req.tenantId,
    title,
    description,
    status: 'ideation'
  };

  try {
    const queryStr = 'INSERT INTO content.ct_videos (id, tenant_id, title, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const params = [newVideo.id, newVideo.tenant_id, newVideo.title, newVideo.description, newVideo.status];
    const result = await pool.query(queryStr, params);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    // Push and return mock fallback
    mockVideos.push(newVideo);
    res.status(201).json(newVideo);
  }
});

app.listen(PORT, () => {
  console.log(`Content Service initialized on port ${PORT}`);
});
