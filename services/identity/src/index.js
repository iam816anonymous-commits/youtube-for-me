const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 1. Startup Configuration & Environment Validation
const PORT = process.env.PORT || 8081;
const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

if (!JWT_SECRET) {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'FATAL',
    service: 'identity-service',
    message: 'Configuration Error: Required environment variable JWT_SECRET is missing.'
  }));
  process.exit(1);
}

// 2. Structured JSON Logger Helper
const log = (level, message, correlationId = '', meta = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: 'identity-service',
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

// 4. Health & Readiness Checks
app.get('/health', (req, res) => {
  sendResponse(res, 200, true, { status: 'healthy', service: 'identity-service' });
});

app.get('/ready', (req, res) => {
  sendResponse(res, 200, true, { status: 'ready', service: 'identity-service' });
});

// Mock Google OAuth Auth redirect flow
app.get('/api/v1/auth/login', (req, res) => {
  const redirectInfo = {
    message: 'Redirecting to Google Consent screen...',
    oauth_url: `https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-id&redirect_uri=http://localhost:3000/api/auth/google/callback&response_type=code&scope=profile%20email`
  };
  sendResponse(res, 200, true, redirectInfo);
});

// Exchange code for JWT tokens (supports dynamic custom user tenant context)
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

  sendResponse(res, 200, true, {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: payload
  });
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
  log('INFO', `Identity Service initialized on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
  log('INFO', `Received ${signal}. Starting graceful shutdown of Identity Service...`);
  server.close(() => {
    log('INFO', 'Identity Service HTTP server closed. Process exiting.');
    process.exit(0);
  });

  // Force shutdown after 10s if sockets are hanging
  setTimeout(() => {
    log('WARN', 'Forced shutdown triggered after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
