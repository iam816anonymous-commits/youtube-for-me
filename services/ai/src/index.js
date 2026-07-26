const express = require('express');
const crypto = require('crypto');

// 1. Startup Configuration & Environment Validation
const PORT = process.env.PORT || 8085;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

// 2. Structured JSON Logger Helper
const log = (level, message, correlationId = '', meta = {}) => {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: 'ai-service',
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

// Original OpenAI configuration variables in service state
let globalOpenaiApiKey = '';

// Endpoint to dynamically alter original OpenAI variables from UI Settings panel
app.post('/api/v1/ai/config', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) globalOpenaiApiKey = apiKey.trim();

  log('INFO', `Original variables dynamically updated: OpenAI key updated: ${!!apiKey}`, req.correlationId);

  sendResponse(res, 200, true, {
    message: 'Original OpenAI API credentials dynamically altered in ai-service state.',
    config: {
      hasApiKey: !!globalOpenaiApiKey
    }
  });
});

// Generate Vector Embeddings (Supports real-time requests to OpenAI when key is provided via UI headers or resolved globally)
app.post('/api/v1/ai/embeddings', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return sendResponse(res, 400, false, null, {}, [{ code: 'MISSING_PARAMETER', message: 'Missing input text parameter' }]);
  }

  const userApiKey = req.headers['x-openai-key'] || globalOpenaiApiKey;

  if (userApiKey && !userApiKey.startsWith('mock_') && userApiKey.trim() !== '') {
    try {
      log('INFO', 'Real-time OpenAI API Key found. Querying OpenAI API v1/embeddings...', req.correlationId);
      const openAiResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userApiKey}`
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small'
        })
      });

      if (openAiResponse.ok) {
        const result = await openAiResponse.json();
        return sendResponse(res, 200, true, {
          model: result.model || 'text-embedding-3-small',
          dimensions: result.data[0].embedding.length,
          embedding: result.data[0].embedding,
          realtime: true
        });
      } else {
        const errDetails = await openAiResponse.text();
        log('ERROR', `OpenAI Error Details: ${errDetails}`, req.correlationId);
        throw new Error(`OpenAI HTTP Error: ${openAiResponse.status} - ${errDetails}`);
      }
    } catch (err) {
      return sendResponse(res, 502, false, null, {}, [{ code: 'OPENAI_GATEWAY_ERROR', message: err.message }]);
    }
  }

  // Fallback to high-fidelity simulated 1536 float dimension when no active API Key is sent
  const mockEmbedding = Array.from({ length: 1536 }, () => Number(Math.random().toFixed(6)));

  sendResponse(res, 200, true, {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    embedding: mockEmbedding,
    realtime: false
  });
});

// Auto-Tagging & Classification Engine
app.post('/api/v1/ai/classify', (req, res) => {
  const { content } = req.body;
  if (!content) {
    return sendResponse(res, 400, false, null, {}, [{ code: 'MISSING_PARAMETER', message: 'Missing content body parameter' }]);
  }

  // Basic mock keyword routing
  let tags = ['Ancient History'];
  let category = 'Unclassified';

  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('rome') || lowerContent.includes('caesar')) {
    tags.push('Roman Empire');
    category = 'Rome Chronicles';
  }
  if (lowerContent.includes('sparta') || lowerContent.includes('greece')) {
    tags.push('Greek Civilisation');
    category = 'Greek Legends';
  }

  sendResponse(res, 200, true, {
    tags,
    category,
    confidence_score: 0.945
  });
});

// AI Copilot Outlines & Scripts Generation
app.post('/api/v1/ai/copilot/outline', (req, res) => {
  const { title, reference_notes } = req.body;
  if (!title) {
    return sendResponse(res, 400, false, null, {}, [{ code: 'MISSING_PARAMETER', message: 'Missing outline title parameter' }]);
  }

  const scriptOutline = `
# SCRIPT OUTLINE: ${title}
## Target Duration: 15 minutes

### I. INTRODUCTION & HOOK (0:00 - 2:30)
- Present the core enigma: why do myths still captivate modern audiences?
- Reference material cited: ${reference_notes || 'General References'}

### II. ARCHAEOLOGICAL EVIDENCE (2:30 - 8:00)
- Trace geographic timelines and civilization remnants.
- Cite Herodotus citations regarding battlefield passage positions.

### III. DISCUSSION & CRITICAL ANALYSIS (8:00 - 13:00)
- Juxtapose myth with historical fact patterns.

### IV. OUTRO & ENGAGEMENT HOOK (13:00 - 15:00)
- Call-to-action prompt matching high engagement metrics.
  `;

  sendResponse(res, 200, true, {
    title,
    outline: scriptOutline,
    generated_at: new Date().toISOString()
  });
});

// 4. Health & Readiness Checks
app.get('/health', (req, res) => {
  sendResponse(res, 200, true, { status: 'healthy', service: 'ai-service' });
});

app.get('/ready', (req, res) => {
  sendResponse(res, 200, true, { status: 'ready', service: 'ai-service' });
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
  log('INFO', `AI Service initialized on port ${PORT}`);
});

const gracefulShutdown = (signal) => {
  log('INFO', `Received ${signal}. Starting graceful shutdown of AI Service...`);
  server.close(() => {
    log('INFO', 'AI Service HTTP server closed. Process exiting.');
    process.exit(0);
  });

  setTimeout(() => {
    log('WARN', 'Forced shutdown triggered after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
