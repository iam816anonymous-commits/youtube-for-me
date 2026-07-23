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
    const result = await pool.query('SELECT * FROM rm_roadmaps WHERE tenant_id = $1', [DEFAULT_TENANT_ID]);
    res.json(result.rows);
  } catch (err) {
    res.json(mockRoadmaps);
  }
});

// Create roadmap
app.post('/api/v1/roadmaps', async (req, res) => {
  const { title, description, target_date } = req.body;
  const newRoadmap = {
    id: require('crypto').randomUUID(),
    tenant_id: DEFAULT_TENANT_ID,
    title,
    description,
    target_date: target_date || '2024-12-31'
  };

  try {
    const queryStr = 'INSERT INTO rm_roadmaps (id, tenant_id, title, description, target_date) VALUES ($1, $2, $3, $4, $5) RETURNING *';
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
