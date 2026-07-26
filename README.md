# Content Intelligence Platform (CIP)
## The Premium AI-Powered YouTube Operating System (YT-OS)

---

## 1. Executive Summary & Vision

The **Content Intelligence Platform (CIP)** is an enterprise-grade, event-driven, multi-tenant operating system designed for modern creators, educators, and content networks. Moving beyond a simple analytics dashboard, CIP operates as a comprehensive **Content Intelligence Platform** that integrates raw research, citation bibliographies, dynamic database schemas, and Google YouTube Data/Analytics API ingestion into a unified strategic decision pipeline.

### Architectural Evolutionary Roadmap:
*   **Phase 1 (Active):** Single Admin Workspace + Resilient Simulated Sandbox.
*   **Phase 2 (Active):** Knowledge Reference Indexing & Real-Time AI Vector Embeddings.
*   **Phase 3 (Active):** Searchable Public Bibliography Portal with Interactive SVG Knowledge Graphs.
*   **Phase 4 (Active):** Multi-Tenant SaaS Workspace Scaling. Dynamic workspace context (tenant) switching, claim extraction, and partitioned relational isolation.

---

## 2. Implemented Architecture Style

CIP is built on a **Domain-Driven Design (DDD)** and **Database-Per-Service** microservice model. All services are logical, stateless, cleanly segregated, and initially orchestrated together inside a single virtual local container mesh using Docker Compose and Kong API Declarative Routing.

```text
                                Internet / Client Browsers
                                            │
                                            ▼
                                Kong Declarative API Gateway (Port 8000)
                                            │
        ┌───────────────────────┬───────────┴───────────┬────────────────────────┐
        ▼                       ▼                       ▼                        ▼
Identity Service          Content Service        Roadmap Service         Knowledge Service
  (Port 8081)             (Port 8082)             (Port 8083)             (Port 8084)
        │                       │                       │                        │
        └───────────────────────┼───────────┬───────────┴────────────────────────┘
                                ▼           ▼
                            AI Service   YouTube Sync Service
                           (Port 8085)   (Port 8086) [Capped Quota Tracker]
                                            │
                                            ▼
                                  Schema Manager Service
                                  (Port 8088) [Telugu NVARCHAR Whitelist]
```

### Core Architecture Components:
1.  **Kong API Gateway (Port 8000):** Acts as the single entry point. Gathers incoming paths (e.g., `/api/v1/auth`, `/api/v1/videos`, `/api/v1/schemas`, `/api/v1/youtube`) and routes them without path stripping (`strip_path: false`) to correct target microservice containers.
2.  **Identity Service (Port 8081):** Issues JWT tokens with dynamic SaaS tenant claims to segregate brand datasets.
3.  **Content Service (Port 8082):** Manages the core ideation and published backlog catalogs. Resolves PG query filters dynamically using active custom header tenant claims (`X-Tenant-Id`).
4.  **Roadmap Service (Port 8083):** Tracks milestones, goals, and content strategy tracks.
5.  **Knowledge Service (Port 8084):** Tracks bibliographic reference books, citations, and research notes.
6.  **AI Service (Port 8085):** Computes 1536-dimensional vector float embeddings, outlines, and scripts. Connects dynamically to OpenAI's official APIs when an active developer key is supplied.
7.  **YouTube Sync Service (Port 8086):** Authenticates with the official Google API Client Library (`googleapis`), refreshing access tokens dynamically to sync playlists and metrics. Incorporates a **strict daily 10,000 unit quota tracker** that throws 429 warnings if sync rates would overrun.
8.  **Schema Manager Service (Port 8088):** Dynamically executes `CREATE TABLE` and `ALTER TABLE` DDL queries straight from the Admin settings console. Employs strong alphanumeric regex naming checks and datatype whitelists (specifically permitting `NVARCHAR`, `NVARCHAR(255)`, `NCHAR`, and `NCHAR(10)` to support **Telugu/multilingual title registers**) to prevent SQL Injection.
9.  **PostgreSQL (Port 5432):** Fully partitioned under isolated logical schemas (`content`, `roadmap`, `knowledge`, `analytics`) matching service boundaries.

---

## 3. Quota Management Guardrails

The platform strictly monitors YouTube Data API quota weights:
*   **Daily Allowance:** Capped strictly at **10,000 units** per Google Cloud project (resets at midnight PT).
*   **Weighted Unit Costs:**
    *   `search.list` : **100 units**
    *   `videos.list` / `commentThreads.list` : **1 unit**
    *   `videos.insert` (Uploads) : **1,600 units**
*   **Ceiling Assertion:** Dynamic check-and-increment operations prevent accidental quota overrun by immediately returning `429 QUOTA_EXCEEDED` if requests would breach constraints.

---

## 4. Getting Started (Developer Setup)

### 4.1 Prerequisites:
Make sure you have Node.js (v18+) and Docker installed on your host.

### 4.2 Start the Infrastructure Mesh:
```bash
# Spin up Kong Gateway, Postgres, RabbitMQ, and the 7 Express services + 2 Frontends
docker-compose up --build -d
```

### 4.3 Seeding the Database:
On startup, the PostgreSQL instance automatically executes the schema partitioner and pre-seeded tables inside `services/database/init.sql`.

### 4.4 Run Service Unit Tests:
```bash
# Content Service test suites
cd services/content && npm install && npm test

# AI Service test suites
cd services/ai && npm install && npm test
```

### 4.5 Dynamic Config Injection (Settings Panel):
To shift from mock sandbox simulations to live real-time API integrations:
1.  Open the Admin Dashboard in your browser (`http://localhost:3000`).
2.  Navigate to the **Platform Configuration Settings HUD** at the top.
3.  Provide your production OpenAI API Key and Google OAuth keys (Client ID, Client Secret, and Access Token).
4.  Saving these credentials immediately persists them inside browser local storage and propagates them over live POST config queries straight to the memory states of running services, dynamically altering the original variables in real-time.
