const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8081;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_sign_key';
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

app.use(express.json());

// Diagnostic Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'identity-service',
    timestamp: new Date().toISOString()
  });
});

// Mock Google OAuth Auth redirect flow
app.get('/api/v1/auth/login', (req, res) => {
  res.json({
    message: 'Redirecting to Google Consent screen...',
    oauth_url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-id&redirect_uri=http://localhost:3000/api/auth/google/callback&response_type=code&scope=profile%20email`
  });
});

// Exchange code for JWT tokens (Phase 4: supports dynamic custom user tenant context)
app.post('/api/v1/auth/callback', (req, res) => {
  const { code, target_tenant_id } = req.body;

  const tenantId = target_tenant_id || DEFAULT_TENANT_ID;

  // Create verified user profile payload with targeted tenant context
  const payload = {
    userId: 'admin-user-01',
    email: 'creator@contentintelligence.platform',
    role: 'administrator',
    tenant_id: tenantId
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId: payload.userId, tenant_id: tenantId }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    status: 'success',
    access_token: accessToken,
    refresh_token: refreshToken,
    user: payload
  });
});

app.listen(PORT, () => {
  console.log(`Identity Service initialized on port ${PORT}`);
});
