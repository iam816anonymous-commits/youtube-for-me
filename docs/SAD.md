# Software Architecture Document (SAD)
## For Content Intelligence Platform (CIP)

---

## 1. Architectural Style & Design Principles

The Content Intelligence Platform (CIP) is designed as a modular, **Event-Driven Microservices Architecture** based on the principles of **Domain-Driven Design (DDD)**.

### 1.1 Core Architectural Principles
* **Loose Coupling:** Individual microservices possess distinct responsibilities and have zero direct access to foreign databases (the **Database-per-Service** pattern).
* **Asynchronous Event-Driven Messaging:** Long-running, multi-domain interactions (such as video imports triggering AI categorization, semantic embedding creation, and index updates) are coordinated via an asynchronous **Event Bus**.
* **API Gateway Pattern:** External client layers (Admin Dashboard and Public Portal) interface exclusively with a unified **API Gateway**, obscuring the underlying service network layout and providing a single entry point for routing, authentication, and rate limiting.
* **CQRS (Command Query Responsibility Segregation) Readiness:** Database architectures segregate state-mutating actions (e.g., adding research items, modifying video status) from intensive read actions (e.g., pulling metrics dashboard matrices or querying semantic vectors) to optimize scale and performance.
* **Multi-tenant Readiness:** Every persistence layer schema integrates `tenant_id` partitions, ensuring frictionless transformation to a multi-user SaaS structure without architectural redesign.

---

## 2. High-Level System Architecture

The following diagram defines the structural communication pathways between the external networks, client layers, API routing gateway, identity providers, the Event Bus, and individual domain-focused microservices.

```text
                                  Internet
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │    API Gateway / Proxy        │
                     └───────┬───────────────┬───────┘
                             │               │
                             ▼               ▼
                     ┌──────────────┐ ┌──────────────┐
                     │ Admin Portal │ │ Public Portal│
                     └───────┬──────┘ └───────┬──────┘
                             │               │
                             ▼               ▼
                      ───────┴───────┬───────┴───────
                                     │
                                     ▼
                            [Identity Service] (Google OAuth / JWT)
                                     │
                 ━━━━━━━━━━━━━━━━━ Event Bus ━━━━━━━━━━━━━━━━━
                  │           │           │           │
                  ▼           ▼           ▼           ▼
             [Content]   [Analytics]  [Knowledge]    [AI]
              Service     Service      Service     Service
                  │           │           │           │
                  ▼           ▼           ▼           ▼
             ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
             │Postgres │ │Postgres │ │Postgres │ │Postgres │
             │  (SQL)  │ │(Part'd) │ │+pgvector│ │ (Cache) │
             └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## 3. Bounded Contexts

To guarantee cohesive, manageable service boundaries, the business logic domain is divided into five strictly defined **Bounded Contexts**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          Identity Context                              │
│  - Credentials & Federated Logins (Google OAuth)                       │
│  - Token Issuance, Secret Management, User Registration                │
│  - RBAC Scope Validation (Admin vs. Reader)                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Emits: UserLoggedIn, ProfileUpdated
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           Content Context                              │
│  - Video Assets, Custom Roadmap Tracks, Content Scheduling             │
│  - Series Grouping, Playlist Hierarchies                               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Emits: VideoCreated, StatusChanged
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          Knowledge Context                             │
│  - Bibliography Records (Books, PDFs, Academic Notes)                  │
│  - Chronological Timelines, Cultural/Historical Entity Registries     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Emits: ResearchImported, NoteAdded
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             AI Context                                 │
│  - LLM Prompt Pipelines, Automated Vector Segment Embedding Generation │
│  - Transcript Text Summarizations & Natural Language Processing        │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Bounded Context Definitions
1. **Identity Context:** Governs all access credentials, session lifecycle elements, and user privilege matrices.
2. **Content Context:** Captures physical content items, scheduling paths, and state workflows (Ideation to Published).
3. **Analytics Context:** Manages time-series aggregations, retention arrays, and performance trends.
4. **Knowledge Context:** Collects cross-referenced academic, historical, and bibliographic references, enabling rich contextual linking.
5. **AI & Search Context:** Translates physical documents and media metadata into mathematical coordinates (vectors), executing LLM summaries and similarity calculations.

---

## 4. Microservice Specification & Storage Topology

Each service is packaged as an independent container with its own private database:

| Service Name | Primary Responsibility | REST / gRPC API Base | Persistence Engine |
| :--- | :--- | :--- | :--- |
| **Identity Service** | Google OAuth 2.0 flow, JWT generation, session management, and RBAC operations. | `/api/auth` | PostgreSQL (Shared schema configuration ready) |
| **YouTube Sync Service** | Connects to Google YouTube API, imports playlists, pulls analytics, and updates metrics every 6 hours. | Internal workers / cron | Redis (Job queues & caches) |
| **Content Service** | Manages `Video`, `Series`, and `Roadmap` lifecycle actions and workflow states. | `/api/videos` | PostgreSQL (Transactional) |
| **Analytics Service** | Gathers views, subscriber snapshots, and retention arrays. | `/api/analytics` | PostgreSQL (Partitioned tables) |
| **Knowledge Service** | Manages research, bibliography books, Dynasty/Civilization nodes, and historical reference quotes. | `/api/library` | PostgreSQL + **pgvector** |
| **AI Service** | Computes vector embeddings, triggers LLM scripting assistants, and auto-tags videos. | `/api/ai` | Redis Cache (temporary vectors) |
| **Search Service** | Unifies semantic similarity queries with keyword lookups. | `/api/search` | PostgreSQL + pgvector Indexes / OpenSearch |

---

## 5. Event Bus & Event Catalog

Asynchronous events are dispatched across a message broker (e.g., RabbitMQ, Kafka, or a lightweight Redis Pub/Sub model inside Docker Compose):

```text
[Content Service] --(video.published)--> [Event Bus]
                                              │
                    ┌─────────────────────────┴────────────────────────┐
                    ▼                                                  ▼
         [AI Service] (Generates transcript summaries)      [Search Service] (Updates index)
```

### Core System Event Catalog
* **`auth.user_authenticated`:** Dispatched when an admin logs in. Contains session markers and IP ranges.
* **`video.status_updated`:** Dispatched when a video transitions states (e.g., `Scripting` to `Recording`).
* **`video.published`:** Emitted when a video is marked as Published on YouTube. Triggers automatic analytics profile initialization.
* **`research.note_created`:** Dispatched when a new research item is added. Triggers the AI Service to generate embeddings and run auto-tagging.
* **`sync.youtube_completed`:** Dispatched when a background YouTube data synchronization task completes successfully. Triggers the Analytics Service to compute updated trends.

---

## 6. Observability, Security, & Testing Infrastructure

### 6.1 Observability Suite
To monitor system health and resolve cross-service errors, CIP integrates:
* **Metrics Gathering:** Prometheus pulls performance metrics from service `/metrics` endpoints.
* **Visual Dashboards:** Grafana displays real-time resource utilization, API response latencies, and message queue lengths.
* **Distributed Tracing:** OpenTelemetry traces trace API requests as they flow from the gateway through backend services and the Event Bus.
* **Log Aggregation:** Microservices output structured JSON logs to standard output, which are aggregated and indexed for easy querying.

### 6.2 Security Policy Matrix
* **Gateway Authentication:** The API Gateway intercepts all requests to `/api/*` (excluding `/api/auth/*` and public routes), validating the presence of a signature-verified JWT.
* **Transport Encryption:** All transit vectors (including external user connections and internal database tunnels) mandate TLS 1.3 protocol layers.
* **Token Rotation Policy:** Access tokens use short lifetimes (15 minutes), requiring refresh validation.

### 6.3 Progressive Testing Strategy
```text
┌────────────────────────────────────────────────────────┐
│ 1. Unit Tests (Mock external API, isolate logic)       │
├────────────────────────────────────────────────────────┤
│ 2. Integration Tests (Verify pgvector & SQL schemas)   │
├────────────────────────────────────────────────────────┤
│ 3. Contract Tests (Validate API contracts via gateway) │
├────────────────────────────────────────────────────────┤
│ 4. End-to-End Tests (Execute full user paths in UI)     │
└────────────────────────────────────────────────────────┘
```
* **Contract Tests:** Ensure APIs remain stable as individual services are updated.
* **Chaos Engineering (Phase 4):** Verify that the system can gracefully handle service outages or network failures.
