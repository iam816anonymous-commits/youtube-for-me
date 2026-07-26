const express = require('express');

const app = express();
const PORT = process.env.PORT || 8085;
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000000';

app.use(express.json());

// Diagnostic Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-service',
    timestamp: new Date().toISOString()
  });
});

// Original OpenAI configuration variables in service state
let globalOpenaiApiKey = '';

// Endpoint to dynamically alter original OpenAI variables from UI Settings panel
app.post('/api/v1/ai/config', (req, res) => {
  const { apiKey } = req.body;
  if (apiKey) globalOpenaiApiKey = apiKey.trim();

  console.log(`[AI-Service Config] Original variables dynamically updated: OpenAI key updated: ${!!apiKey}`);

  res.json({
    success: true,
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
    return res.status(400).json({ error: 'Missing input text parameter' });
  }

  const userApiKey = req.headers['x-openai-key'] || globalOpenaiApiKey;

  if (userApiKey && !userApiKey.startsWith('mock_') && userApiKey.trim() !== '') {
    try {
      console.log('Real-time OpenAI API Key found in request headers. Querying OpenAI API v1/embeddings...');
      // Dynamic real-time fetch to official OpenAI endpoint using native node fetch (or global fetch)
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
        return res.json({
          status: 'success',
          model: result.model || 'text-embedding-3-small',
          dimensions: result.data[0].embedding.length,
          embedding: result.data[0].embedding,
          realtime: true
        });
      } else {
        const errDetails = await openAiResponse.text();
        console.error('OpenAI Error Details:', errDetails);
        throw new Error(`OpenAI HTTP Error: ${openAiResponse.status} - ${errDetails}`);
      }
    } catch (err) {
      return res.status(502).json({
        error: 'Failed to complete real-time OpenAI embedding request.',
        details: err.message
      });
    }
  }

  // Fallback to high-fidelity simulated 1536 float dimension when no active API Key is sent
  const mockEmbedding = Array.from({ length: 1536 }, () => Number(Math.random().toFixed(6)));

  res.json({
    status: 'success',
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
    return res.status(400).json({ error: 'Missing content body parameter' });
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

  res.json({
    tags,
    category,
    confidence_score: 0.945
  });
});

// AI Copilot Outlines & Scripts Generation
app.post('/api/v1/ai/copilot/outline', (req, res) => {
  const { title, reference_notes } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Missing outline title parameter' });
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

  res.json({
    title,
    outline: scriptOutline,
    generated_at: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`AI Service initialized on port ${PORT}`);
});
