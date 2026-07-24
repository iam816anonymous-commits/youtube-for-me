# Developer Execution and Operation Guide
## For Content Intelligence Platform (CIP)

---

## 1. Local Sandboxed Environment Spin-up

To boot up the entire microservice ecosystem, verify that you have Docker and Docker Compose installed locally, then execute the following from the root directory:

```bash
# 1. Spin up the entire multi-service container mesh
docker compose up -d

# 2. Check and verify container running status
docker compose ps
```

---

## 2. API Gateway & Service Ports

All external actions and requests route through the Kong API Gateway on port **8000**:

*   **Kong Proxy Port:** `http://localhost:8000`
*   **Kong Admin Dashboard:** `http://localhost:8001`
*   **Next.js Admin Workspace:** `http://localhost:3000`
*   **RabbitMQ Dashboard:** `http://localhost:15672` (Credentials: `guest`/`guest`)
*   **PostgreSQL Engine:** `localhost:5432`

---

## 3. Microservice Operation & Verification Commands

Below are step-by-step diagnostic Curl commands that bypass local frontend proxies, testing each microservice endpoint routed via Kong Gateway directly.

### 3.1 Verify Microservice Health States
```bash
# Identity Service Health
curl -X GET http://localhost:8000/api/v1/auth/health

# Content Service Health
curl -X GET http://localhost:8000/api/v1/videos/health

# Roadmap Service Health
curl -X GET http://localhost:8000/api/v1/roadmaps/health

# Knowledge Service Health
curl -X GET http://localhost:8000/api/v1/library/health

# AI Service Health
curl -X GET http://localhost:8000/api/v1/ai/health
```

### 3.2 Authenticating & Token Issuance (Identity Service)
```bash
# Obtain Google OAuth mock URL
curl -X GET http://localhost:8000/api/v1/auth/login

# Exchange authorization codes for a valid Admin JWT token
curl -X POST http://localhost:8000/api/v1/auth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "mock-code-123"}'
```

### 3.3 Create and Query Videos (Content Service)
```bash
# Register a new video concept into the backlog
curl -X POST http://localhost:8000/api/v1/videos \
  -H "Content-Type: application/json" \
  -d '{"title": "The Bronze Age Collapse Theories", "description": "Analyzing environmental factors"}'

# Query all videos
curl -X GET http://localhost:8000/api/v1/videos
```

### 3.4 Create and Query Strategic Goals (Roadmap Service)
```bash
# Register a strategic milestone tracker
curl -X POST http://localhost:8000/api/v1/roadmaps \
  -H "Content-Type: application/json" \
  -d '{"title": "Middle Eastern Dynasties Track", "description": "Covering Sumerians, Babylonians, and Assyrians", "target_date": "2024-11-30"}'

# Query all roadmaps
curl -X GET http://localhost:8000/api/v1/roadmaps
```

### 3.5 Register and Manage Bibliographies (Knowledge Service)
```bash
# Add an academic book to the library vault
curl -X POST http://localhost:8000/api/v1/library/books \
  -H "Content-Type: application/json" \
  -d '{"title": "1177 B.C.: The Year Civilization Collapsed", "author": "Eric H. Cline", "isbn": "978-0691168388"}'

# Fetch all registered books
curl -X GET http://localhost:8000/api/v1/library/books

# Register a detailed research note
curl -X POST http://localhost:8000/api/v1/library/notes \
  -H "Content-Type: application/json" \
  -d '{"book_id": "1001-abc-9923", "title": "Passage regarding sea peoples", "raw_content": "Cline explores archaeological findings on migrating confederations.", "tag_entities": ["Sea Peoples", "Bronze Age"]}'

# Fetch all research notes
curl -X GET http://localhost:8000/api/v1/library/notes
```

### 3.6 Execute Embeddings & Script Outlines (AI Service)
```bash
# Calculate a standard 1536-dimensional float vector array
curl -X POST http://localhost:8000/api/v1/ai/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text": "Calculate coordinates for sea peoples archaeological passage."}'

# Execute Auto-tagging & Classification pipeline
curl -X POST http://localhost:8000/api/v1/ai/classify \
  -H "Content-Type: application/json" \
  -d '{"content": "Drafting outline for Caesar crossing the Rubicon river in Rome."}'

# Generate script outline through Copilot Assistant
curl -X POST http://localhost:8000/api/v1/ai/copilot/outline \
  -H "Content-Type: application/json" \
  -d '{"title": "The Crossing of the Rubicon", "reference_notes": "Note id n1 on Rome historical events"}'
```

---

## 4. Diagnostics, Logs, & Tear-down

### 4.1 View Real-time Service Logs
To inspect logs across all services or a specific container:
```bash
# View combined logs
docker compose logs -f

# View AI Service logs specifically
docker compose logs -f ai-service
```

### 4.2 Database Access
```bash
# Login directly to the master PostgreSQL DB container
docker exec -it cip-postgres-db psql -U cip_admin -d cip_master_db
```

### 4.3 Clean Tear-down
```bash
# Stop all services and clear networking buffers
docker compose down

# Stop all services and permanently purge postgres volume caches
docker compose down -v
```
